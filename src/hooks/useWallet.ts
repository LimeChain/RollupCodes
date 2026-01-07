import { useState, useEffect, useCallback } from 'react'
import { formatEther } from 'ethers'

export interface WalletState {
    isConnected: boolean
    isConnecting: boolean
    address: string | null
    balance: string | null
    chainId: number | null
    error: string | null
}

export interface UseWalletReturn extends WalletState {
    connect: (walletType: 'metamask' | 'walletconnect') => Promise<boolean>
    disconnect: () => void
    switchNetwork: (chainId: number) => Promise<boolean>
    formatAddress: (address: string) => string
}

// Get the ethereum provider (generic)
const getEthereum = (): any => {
    if (typeof window !== 'undefined') {
        return (window as any).ethereum
    }
    return null
}

// Check if a provider is the real MetaMask (not a wallet masquerading as MetaMask)
const isRealMetaMask = (provider: any): boolean => {
    if (!provider) return false

    // MetaMask has a unique _metamask object with isUnlocked method
    // Other wallets that set isMetaMask: true don't have this
    const hasMetaMaskInternals = provider._metamask && typeof provider._metamask.isUnlocked === 'function'

    // Also check it claims to be MetaMask and isn't another known wallet
    const claimsMetaMask = provider.isMetaMask === true
    const isNotOtherWallet = !provider.isAmbire &&
                            !provider.isBraveWallet &&
                            !provider.isCoinbaseWallet &&
                            !provider.isRabby &&
                            !provider.isTrust

    return claimsMetaMask && isNotOtherWallet && hasMetaMaskInternals
}

// Get MetaMask provider specifically
// When multiple wallets are installed, they may all inject into window.ethereum
// MetaMask exposes providers array when this happens
const getMetaMaskProvider = (): any => {
    if (typeof window === 'undefined') return null

    const ethereum = (window as any).ethereum
    if (!ethereum) return null

    // Check if there are multiple providers (multiple wallets installed)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
        // Find the real MetaMask specifically
        const metaMaskProvider = ethereum.providers.find(isRealMetaMask)
        if (metaMaskProvider) {
            return metaMaskProvider
        }

        // Fallback: find any provider claiming to be MetaMask with _metamask object
        const fallbackProvider = ethereum.providers.find(
            (p: any) => p.isMetaMask && p._metamask
        )
        if (fallbackProvider) {
            return fallbackProvider
        }
    }

    // Single provider - check if it's the real MetaMask
    if (isRealMetaMask(ethereum)) {
        return ethereum
    }

    // Fallback for single provider with _metamask object
    if (ethereum.isMetaMask && ethereum._metamask) {
        return ethereum
    }

    return null
}

export function useWallet(): UseWalletReturn {
    const [state, setState] = useState<WalletState>({
        isConnected: false,
        isConnecting: false,
        address: null,
        balance: null,
        chainId: null,
        error: null,
    })

    // Store the active provider reference
    const [activeProvider, setActiveProvider] = useState<any>(null)

    // Format address to shortened version
    const formatAddress = useCallback((address: string): string => {
        if (!address) return ''
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }, [])

    // Get balance for an address
    const getBalance = useCallback(async (address: string, provider?: any): Promise<string | null> => {
        const ethereum = provider || activeProvider || getEthereum()
        if (!ethereum) return null

        try {
            // Use raw RPC call to avoid BrowserProvider network caching issues after chain switch
            const balanceHex = await ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest'],
            })
            return formatEther(BigInt(balanceHex))
        } catch (error) {
            console.error('Error getting balance:', error)
            return null
        }
    }, [activeProvider])

    // Connect to wallet
    const connect = useCallback(async (walletType: 'metamask' | 'walletconnect'): Promise<boolean> => {
        // Clear disconnect flag since user is explicitly connecting
        if (typeof window !== 'undefined') {
            localStorage.removeItem('wallet_disconnected')
        }

        if (walletType === 'metamask') {
            // Get MetaMask provider specifically
            const metaMaskProvider = getMetaMaskProvider()

            if (!metaMaskProvider) {
                // Check if any ethereum provider exists but it's not MetaMask
                const genericEthereum = getEthereum()
                if (genericEthereum) {
                    // Log providers for debugging
                    console.log('Available providers:', {
                        hasProviders: !!genericEthereum.providers,
                        providersCount: genericEthereum.providers?.length,
                        isMetaMask: genericEthereum.isMetaMask,
                        hasMetaMaskInternal: !!genericEthereum._metamask,
                    })

                    // Try a less strict fallback - just use any provider claiming to be MetaMask
                    if (genericEthereum.isMetaMask) {
                        console.log('Using fallback MetaMask detection')
                        // Continue with this provider as fallback
                        setState(prev => ({ ...prev, isConnecting: true, error: null }))
                        try {
                            const accounts = await genericEthereum.request({
                                method: 'eth_requestAccounts',
                            })
                            if (accounts && accounts.length > 0) {
                                const address = accounts[0]
                                const chainId = await genericEthereum.request({ method: 'eth_chainId' })
                                const balance = await getBalance(address, genericEthereum)
                                setActiveProvider(genericEthereum)
                                setState({
                                    isConnected: true,
                                    isConnecting: false,
                                    address,
                                    balance,
                                    chainId: parseInt(chainId, 16),
                                    error: null,
                                })
                                return true
                            }
                        } catch (fallbackError) {
                            console.error('Fallback connection failed:', fallbackError)
                        }
                    }

                    setState(prev => ({
                        ...prev,
                        isConnecting: false,
                        error: 'MetaMask was not detected. Please ensure MetaMask extension is installed, enabled, and refresh the page.',
                    }))
                } else {
                    setState(prev => ({
                        ...prev,
                        error: 'MetaMask is not installed. Please install MetaMask to continue.',
                    }))
                    // Open MetaMask download page
                    window.open('https://metamask.io/download/', '_blank')
                }
                return false
            }

            setState(prev => ({ ...prev, isConnecting: true, error: null }))

            try {
                // Request account access - this will trigger MetaMask popup
                const accounts = await metaMaskProvider.request({
                    method: 'eth_requestAccounts',
                })

                if (accounts && accounts.length > 0) {
                    const address = accounts[0]
                    const chainId = await metaMaskProvider.request({ method: 'eth_chainId' })
                    const balance = await getBalance(address, metaMaskProvider)

                    // Store the active provider
                    setActiveProvider(metaMaskProvider)

                    setState({
                        isConnected: true,
                        isConnecting: false,
                        address,
                        balance,
                        chainId: parseInt(chainId, 16),
                        error: null,
                    })

                    return true
                }

                setState(prev => ({
                    ...prev,
                    isConnecting: false,
                    error: 'No accounts found',
                }))
                return false
            } catch (error: any) {
                console.error('Error connecting to MetaMask:', error)

                let errorMessage = 'Failed to connect to MetaMask'
                if (error.code === 4001) {
                    errorMessage = 'Connection request was rejected'
                } else if (error.code === -32002) {
                    errorMessage = 'Please open MetaMask and complete the connection request'
                }

                setState(prev => ({
                    ...prev,
                    isConnecting: false,
                    error: errorMessage,
                }))
                return false
            }
        } else if (walletType === 'walletconnect') {
            // WalletConnect requires additional setup with @walletconnect/modal
            // For now, show a message that it's not yet implemented
            setState(prev => ({
                ...prev,
                error: 'WalletConnect integration coming soon. Please use MetaMask.',
            }))
            return false
        }

        return false
    }, [getBalance])

    // Disconnect wallet
    const disconnect = useCallback(() => {
        // Set flag to prevent auto-reconnection
        if (typeof window !== 'undefined') {
            localStorage.setItem('wallet_disconnected', 'true')
        }

        setActiveProvider(null)
        setState({
            isConnected: false,
            isConnecting: false,
            address: null,
            balance: null,
            chainId: null,
            error: null,
        })
    }, [])

    // Switch network
    const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
        const provider = activeProvider || getMetaMaskProvider()
        if (!provider) return false

        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            })

            // Wait briefly for provider to fully switch RPC endpoints
            await new Promise(resolve => setTimeout(resolve, 500))

            // Re-fetch balance on the new chain
            const accounts = await provider.request({ method: 'eth_accounts' })
            if (accounts && accounts.length > 0) {
                const balance = await getBalance(accounts[0], provider)
                setState(prev => ({
                    ...prev,
                    chainId,
                    balance,
                }))
            }

            return true
        } catch (error: any) {
            console.error('Error switching network:', error)
            return false
        }
    }, [activeProvider, getBalance])

    // Listen for account and chain changes
    useEffect(() => {
        // Use the active provider if connected, otherwise skip
        if (!activeProvider) return

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                // User disconnected
                disconnect()
            } else if (state.isConnected) {
                // User switched account
                const address = accounts[0]
                const balance = await getBalance(address)
                setState(prev => ({
                    ...prev,
                    address,
                    balance,
                }))
            }
        }

        const handleChainChanged = async (chainId: string) => {
            const newChainId = parseInt(chainId, 16)
            // Get current address from provider to avoid stale closure
            try {
                const accounts = await activeProvider.request({ method: 'eth_accounts' })
                const address = accounts?.[0]
                const balance = address ? await getBalance(address, activeProvider) : null
                setState(prev => ({
                    ...prev,
                    chainId: newChainId,
                    balance,
                }))
            } catch {
                setState(prev => ({
                    ...prev,
                    chainId: newChainId,
                }))
            }
        }

        const handleDisconnect = () => {
            disconnect()
        }

        activeProvider.on('accountsChanged', handleAccountsChanged)
        activeProvider.on('chainChanged', handleChainChanged)
        activeProvider.on('disconnect', handleDisconnect)

        return () => {
            activeProvider.removeListener('accountsChanged', handleAccountsChanged)
            activeProvider.removeListener('chainChanged', handleChainChanged)
            activeProvider.removeListener('disconnect', handleDisconnect)
        }
    }, [activeProvider, state.isConnected, disconnect, getBalance])

    // Auto-reconnect on mount if user was previously connected
    useEffect(() => {
        if (typeof window === 'undefined') return
        // Skip if user explicitly disconnected
        if (localStorage.getItem('wallet_disconnected') === 'true') return

        const tryReconnect = async () => {
            const provider = getMetaMaskProvider()
            if (!provider) return

            try {
                // eth_accounts does NOT prompt — returns [] if not authorized
                const accounts = await provider.request({ method: 'eth_accounts' })
                if (accounts && accounts.length > 0) {
                    const address = accounts[0]
                    const chainId = await provider.request({ method: 'eth_chainId' })
                    const balance = await getBalance(address, provider)
                    setActiveProvider(provider)
                    setState({
                        isConnected: true,
                        isConnecting: false,
                        address,
                        balance,
                        chainId: parseInt(chainId, 16),
                        error: null,
                    })
                }
            } catch {
                // Silently fail — user can connect manually
            }
        }

        tryReconnect()
    }, [getBalance])

    return {
        ...state,
        connect,
        disconnect,
        switchNetwork,
        formatAddress,
    }
}
