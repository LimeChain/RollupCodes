/**
 * Global type declarations
 */

/**
 * EIP-1193 Provider interface
 * https://eips.ethereum.org/EIPS/eip-1193
 */
interface EIP1193Provider {
    isMetaMask?: boolean
    _metamask?: { isUnlocked?: () => Promise<boolean> }
    request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>
    on(event: 'accountsChanged', callback: (accounts: string[]) => void): void
    on(event: 'chainChanged', callback: (chainId: string) => void): void
    on(event: 'disconnect', callback: (error: { code: number; message: string }) => void): void
    on(event: string, callback: (...args: unknown[]) => void): void
    removeListener(event: string, callback: (...args: unknown[]) => void): void
    selectedAddress?: string | null
    chainId?: string
    providers?: EIP1193Provider[]
}

interface Window {
    ethereum?: EIP1193Provider
}
