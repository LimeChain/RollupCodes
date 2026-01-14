/**
 * Shared Network Configuration
 * Single source of truth for all exit-hatch network data
 */

// Import JSON configs
import optimismConfig from './exit-hatch/optimism.json'
import optimismSepoliaConfig from './exit-hatch/optimism-sepolia.json'
import arbitrumConfig from './exit-hatch/arbitrum-one.json'
import baseConfig from './exit-hatch/base.json'
import blastConfig from './exit-hatch/blast.json'
import inkConfig from './exit-hatch/ink.json'
import soneiumConfig from './exit-hatch/soneium.json'
import worldChainConfig from './exit-hatch/world-chain.json'

export type RollupType = 'optimism' | 'arbitrum'

export interface ExitHatchNetwork {
    id: string
    name: string
    icon: string
    chainId: number
    l1ChainId: number
    rollupType: RollupType
    challengePeriodDays: number
    rpcUrl: string
    explorerUrl: string
    // Optimism-specific (OP Stack)
    l2BridgeAddress?: string
    l1PortalAddress?: string
    // Arbitrum-specific
    arbSysAddress?: string
    outboxAddress?: string
    // Testnet flag
    isTestnet: boolean
}

/**
 * Parse a JSON config into ExitHatchNetwork format
 */
function parseNetworkConfig(config: any, isTestnet: boolean = false): ExitHatchNetwork {
    const isArbitrum = config.bridge_contracts.l1_outbox !== undefined
    const rollupType: RollupType = isArbitrum ? 'arbitrum' : 'optimism'

    return {
        id: config.network,
        name: config.network_display.name,
        icon: `/images/${config.network_display.icon}`,
        chainId: config.chain_id,
        l1ChainId: config.network_display.l1_chain_id,
        rollupType,
        challengePeriodDays: config.withdrawal_flow.challenge_period_days,
        rpcUrl: config.network_display.rpc_url,
        explorerUrl: config.network_display.explorer_url,
        // Optimism-specific
        l2BridgeAddress: isArbitrum ? undefined : config.bridge_contracts.l2_bridge.address,
        l1PortalAddress: isArbitrum ? undefined : config.bridge_contracts.l1_portal?.address,
        // Arbitrum-specific
        arbSysAddress: isArbitrum ? config.bridge_contracts.l2_bridge.address : undefined,
        outboxAddress: isArbitrum ? config.bridge_contracts.l1_outbox?.address : undefined,
        isTestnet,
    }
}

/**
 * All supported networks for exit-hatch withdrawals
 */
export const EXIT_HATCH_NETWORKS: ExitHatchNetwork[] = [
    // Mainnets
    parseNetworkConfig(optimismConfig, false),
    parseNetworkConfig(baseConfig, false),
    parseNetworkConfig(arbitrumConfig, false),
    parseNetworkConfig(blastConfig, false),
    parseNetworkConfig(inkConfig, false),
    parseNetworkConfig(soneiumConfig, false),
    parseNetworkConfig(worldChainConfig, false),
    // Testnets
    parseNetworkConfig(optimismSepoliaConfig, true),
    // Arbitrum Sepolia (not in JSON, add manually)
    {
        id: 'arbitrum-sepolia',
        name: 'Arbitrum Sepolia',
        icon: '/images/arbitrum-one-logo.svg',
        chainId: 421614,
        l1ChainId: 11155111,
        rollupType: 'arbitrum',
        challengePeriodDays: 7,
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        explorerUrl: 'https://sepolia.arbiscan.io',
        arbSysAddress: '0x0000000000000000000000000000000000000064',
        outboxAddress: '0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F',
        isTestnet: true,
    },
]

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): ExitHatchNetwork[] {
    return EXIT_HATCH_NETWORKS.filter(n => !n.isTestnet)
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): ExitHatchNetwork[] {
    return EXIT_HATCH_NETWORKS.filter(n => n.isTestnet)
}

/**
 * Get network by ID
 */
export function getNetworkById(id: string): ExitHatchNetwork | undefined {
    return EXIT_HATCH_NETWORKS.find(n => n.id === id)
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): ExitHatchNetwork | undefined {
    return EXIT_HATCH_NETWORKS.find(n => n.chainId === chainId)
}

/**
 * Network filter option for UI dropdowns
 */
export interface NetworkFilterOption {
    id: string
    name: string
    icon: string
}

/**
 * Get network options for filter dropdowns (includes "All Networks")
 */
export function getNetworkFilterOptions(includeTestnets: boolean = false): NetworkFilterOption[] {
    const networks = includeTestnets ? EXIT_HATCH_NETWORKS : getMainnetNetworks()

    return networks.map(n => ({
        id: n.id,
        name: n.name,
        icon: n.icon,
    }))
}

/**
 * Get network display options (without "All Networks" filter)
 */
export function getNetworkDisplayOptions(includeTestnets: boolean = false): NetworkFilterOption[] {
    const networks = includeTestnets ? EXIT_HATCH_NETWORKS : getMainnetNetworks()

    return networks.map(n => ({
        id: n.id,
        name: n.name,
        icon: n.icon,
    }))
}
