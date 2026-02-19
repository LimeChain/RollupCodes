import { BrowserProvider } from 'ethers'

export interface NetworkConfig {
    chainId: number
    chainName: string
    rpcUrl: string
    blockExplorerUrl: string
    nativeCurrency: {
        name: string
        symbol: string
        decimals: number
    }
}

// Client-side RPC URLs read from NEXT_PUBLIC_ env vars.
// IMPORTANT: These must be public endpoints — never put private API keys
// in NEXT_PUBLIC_ variables as they are embedded in the browser bundle.
export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
    // L1
    1: {
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.llamarpc.com',
        blockExplorerUrl: 'https://etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    // L2 — OP Stack
    10: {
        chainId: 10,
        chainName: 'OP Mainnet',
        rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io',
        blockExplorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    8453: {
        chainId: 8453,
        chainName: 'Base',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
        blockExplorerUrl: 'https://basescan.org',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    81457: {
        chainId: 81457,
        chainName: 'Blast',
        rpcUrl: process.env.NEXT_PUBLIC_BLAST_RPC || 'https://rpc.blast.io',
        blockExplorerUrl: 'https://blastscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    57073: {
        chainId: 57073,
        chainName: 'Ink',
        rpcUrl: process.env.NEXT_PUBLIC_INK_RPC || 'https://rpc-gel.inkonchain.com',
        blockExplorerUrl: 'https://explorer.inkonchain.com',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    1868: {
        chainId: 1868,
        chainName: 'Soneium',
        rpcUrl: process.env.NEXT_PUBLIC_SONEIUM_RPC || 'https://rpc.soneium.org',
        blockExplorerUrl: 'https://soneium.blockscout.com',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    480: {
        chainId: 480,
        chainName: 'World Chain',
        rpcUrl: process.env.NEXT_PUBLIC_WORLDCHAIN_RPC || 'https://worldchain-mainnet.g.alchemy.com/public',
        blockExplorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    // L2 — Arbitrum
    42161: {
        chainId: 42161,
        chainName: 'Arbitrum One',
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        blockExplorerUrl: 'https://arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
}

/**
 * Get the current connected chain ID
 */
export async function getCurrentChainId(): Promise<number | null> {
    if (typeof window.ethereum === 'undefined') {
        return null
    }

    try {
        const provider = new BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        return Number(network.chainId)
    } catch (error) {
        console.error('Error getting chain ID:', error)
        return null
    }
}

/**
 * Check if user is on the correct network
 */
export async function validateNetwork(expectedChainId: number): Promise<boolean> {
    const currentChainId = await getCurrentChainId()
    return currentChainId === expectedChainId
}

/**
 * Switch to a specific network
 */
export async function switchToNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
    if (typeof window.ethereum === 'undefined') {
        return { success: false, error: 'MetaMask is not installed' }
    }

    const chainIdHex = `0x${chainId.toString(16)}`

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }]
        })
        return { success: true }
    } catch (error: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (error.code === 4902) {
            return addNetwork(chainId)
        }
        return { success: false, error: error.message }
    }
}

/**
 * Add a network to MetaMask
 */
export async function addNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
    if (typeof window.ethereum === 'undefined') {
        return { success: false, error: 'MetaMask is not installed' }
    }

    const config = NETWORK_CONFIGS[chainId]
    if (!config) {
        return { success: false, error: `Network configuration not found for chain ID ${chainId}` }
    }

    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: `0x${chainId.toString(16)}`,
                    chainName: config.chainName,
                    rpcUrls: [config.rpcUrl],
                    blockExplorerUrls: [config.blockExplorerUrl],
                    nativeCurrency: config.nativeCurrency
                }
            ]
        })
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Listen for network changes
 */
export function onNetworkChange(callback: (chainId: number) => void): () => void {
    if (typeof window.ethereum === 'undefined' || !window.ethereum.on) {
        return () => {}
    }

    const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16)
        callback(chainId)
    }

    window.ethereum.on('chainChanged', handleChainChanged)

    // Return cleanup function
    return () => {
        if (window.ethereum?.removeListener) {
            window.ethereum.removeListener('chainChanged', handleChainChanged as (...args: unknown[]) => void)
        }
    }
}

/**
 * Listen for account changes
 */
export function onAccountChange(callback: (accounts: string[]) => void): () => void {
    if (typeof window.ethereum === 'undefined' || !window.ethereum.on) {
        return () => {}
    }

    const handleAccountsChanged = (accounts: string[]) => {
        callback(accounts)
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)

    // Return cleanup function
    return () => {
        if (window.ethereum?.removeListener) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged as (...args: unknown[]) => void)
        }
    }
}
