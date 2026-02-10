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

export interface DocumentationUrl {
    label: string
    url: string
}

export interface WithdrawalStep {
    id: string
    order: number
    name: string
    description: string
    network: 'l1' | 'l2'
    contractAddress?: string
    contractName?: string
    method?: string
    userActionRequired: 'sign_transaction' | 'wait'
    estimatedTime: string
    estimatedGas?: string
}

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
    // Documentation URLs
    documentationUrls: DocumentationUrl[]
    // Withdrawal flow steps
    withdrawalSteps: WithdrawalStep[]
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
        // Documentation URLs
        documentationUrls: config.documentation_urls || [],
        // Withdrawal flow steps
        withdrawalSteps: (config.withdrawal_flow?.steps || []).map((step: any) => ({
            id: step.id,
            order: step.order,
            name: step.name,
            description: step.description,
            network: step.network,
            contractAddress: step.contract_address,
            contractName: step.contract_name,
            method: step.method,
            userActionRequired: step.user_action_required,
            estimatedTime: step.estimated_time,
            estimatedGas: step.estimated_gas,
        })),
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
        documentationUrls: [
            { label: 'Withdrawal Guide', url: 'https://docs.arbitrum.io/how-arbitrum-works/arbos/l2-l1-messaging' },
            { label: 'ArbSys Documentation', url: 'https://docs.arbitrum.io/build-decentralized-apps/precompiles/reference#arbsys' },
        ],
        withdrawalSteps: [
            {
                id: 'initiate',
                order: 1,
                name: 'Initiate Withdrawal',
                description: 'Call ArbSys to send ETH to L1',
                network: 'l2',
                contractAddress: '0x0000000000000000000000000000000000000064',
                contractName: 'ArbSys',
                method: 'withdrawEth',
                userActionRequired: 'sign_transaction',
                estimatedTime: '~2 minutes',
                estimatedGas: '~65000 L2 gas',
            },
            {
                id: 'wait_challenge',
                order: 2,
                name: 'Challenge Period',
                description: '7 day security window',
                network: 'l1',
                userActionRequired: 'wait',
                estimatedTime: '7 days',
            },
            {
                id: 'finalize',
                order: 3,
                name: 'Execute Withdrawal',
                description: 'Execute withdrawal on L1 Outbox',
                network: 'l1',
                contractAddress: '0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F',
                contractName: 'Outbox',
                method: 'executeTransaction',
                userActionRequired: 'sign_transaction',
                estimatedTime: '~3 minutes',
                estimatedGas: '~90000 L1 gas',
            },
        ],
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
    documentationUrls?: DocumentationUrl[]
    withdrawalSteps?: WithdrawalStep[]
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
        documentationUrls: n.documentationUrls,
        withdrawalSteps: n.withdrawalSteps,
    }))
}
