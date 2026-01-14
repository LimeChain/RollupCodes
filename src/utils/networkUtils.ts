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

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
    // Mainnet
    1: {
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        rpcUrl: 'https://eth.llamarpc.com',
        blockExplorerUrl: 'https://etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    10: {
        chainId: 10,
        chainName: 'Optimism',
        rpcUrl: 'https://mainnet.optimism.io',
        blockExplorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    // Testnet
    11155111: {
        chainId: 11155111,
        chainName: 'Sepolia',
        rpcUrl: 'https://rpc.sepolia.org',
        blockExplorerUrl: 'https://sepolia.etherscan.io',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }
    },
    11155420: {
        chainId: 11155420,
        chainName: 'Optimism Sepolia',
        rpcUrl: 'https://sepolia.optimism.io',
        blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }
    }
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
 * Get balance for a specific address on current network
 */
export async function getBalance(address: string): Promise<string | null> {
    if (typeof window.ethereum === 'undefined') {
        return null
    }

    try {
        const provider = new BrowserProvider(window.ethereum)
        const balance = await provider.getBalance(address)
        return balance.toString()
    } catch (error) {
        console.error('Error fetching balance:', error)
        return null
    }
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
    return NETWORK_CONFIGS[chainId]?.chainName || `Unknown Network (${chainId})`
}

/**
 * Check if a chain ID is a testnet
 */
export function isTestnet(chainId: number): boolean {
    const testnets = [11155111, 11155420, 5, 420, 84531, 421613]
    return testnets.includes(chainId)
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
            window.ethereum.removeListener('chainChanged', handleChainChanged)
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
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
    }
}
