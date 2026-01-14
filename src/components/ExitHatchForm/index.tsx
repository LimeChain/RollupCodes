import { useState, useEffect } from 'react'
import styles from './styles.module.scss'
import { ExitHatchSpec } from '@utils/types'
import NetworkSelector from '@components/NetworkSelector'
import AmountInput from '@components/AmountInput'
import WalletModal from '@components/WalletModal'
import TransactionModal from '@components/TransactionModal'
import { useToast } from '@components/Toast/ToastContainer'
import { BrowserProvider, formatEther } from 'ethers'
import { validateNetwork, switchToNetwork, onNetworkChange as listenToNetworkChange, onAccountChange } from '@utils/networkUtils'
import { initiateWithdrawal } from '@services/withdrawalService'
import { saveWithdrawal, generateWithdrawalId } from '@services/withdrawalStorage'
import { StoredWithdrawal } from '../../types/withdrawal'

interface ExitHatchFormProps {
    currentNetwork: ExitHatchSpec
    allNetworks: ExitHatchSpec[]
    onNetworkChange: (network: string) => void
    onWalletConnect?: (address: string) => void
}

const ExitHatchForm = ({ currentNetwork, allNetworks, onNetworkChange, onWalletConnect }: ExitHatchFormProps) => {
    const { addToast } = useToast()

    // Wallet state
    const [walletAddress, setWalletAddress] = useState<string>('')
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

    // Form state
    const [amount, setAmount] = useState('')
    const [toAddress, setToAddress] = useState('')
    const [balance, setBalance] = useState('0')

    // Transaction state
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)

    // Form validation
    const [amountError, setAmountError] = useState('')
    const [addressError, setAddressError] = useState('')

    // Network validation
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

    const { ui_text, supported_asset, validation, network_display, bridge_contracts } = currentNetwork

    // Check network when wallet connects or network changes
    useEffect(() => {
        const checkNetwork = async () => {
            if (walletAddress) {
                const isValid = await validateNetwork(network_display.l2_chain_id)
                setIsCorrectNetwork(isValid)

                if (!isValid) {
                    addToast(`Please switch to ${network_display.name}`, 'error')
                }
            }
        }
        checkNetwork()
    }, [walletAddress, network_display.l2_chain_id, network_display.name, addToast])

    // Listen for network changes
    useEffect(() => {
        if (!walletAddress) return

        const cleanup = listenToNetworkChange(async (chainId: number) => {
            const isValid = chainId === network_display.l2_chain_id
            setIsCorrectNetwork(isValid)

            if (isValid) {
                addToast(`Switched to ${network_display.name}`, 'success')
                // Refresh balance
                try {
                    const provider = new BrowserProvider(window.ethereum!)
                    const balance = await provider.getBalance(walletAddress)
                    setBalance(formatEther(balance))
                } catch (error) {
                    console.error('Error fetching balance:', error)
                }
            } else {
                addToast(`Wrong network. Please switch to ${network_display.name}`, 'error')
            }
        })

        return cleanup
    }, [walletAddress, network_display.l2_chain_id, network_display.name, addToast])

    // Listen for account changes
    useEffect(() => {
        const cleanup = onAccountChange((accounts) => {
            if (accounts.length === 0) {
                // User disconnected wallet
                setWalletAddress('')
                setBalance('0')
                setIsCorrectNetwork(false)
                onWalletConnect?.('')
            } else if (accounts[0] !== walletAddress) {
                // User switched accounts
                setWalletAddress(accounts[0])
                setToAddress(accounts[0])
                onWalletConnect?.(accounts[0])
            }
        })

        return cleanup
    }, [walletAddress, onWalletConnect])

    // Auto-fill recipient address with wallet address
    useEffect(() => {
        if (walletAddress && !toAddress) {
            setToAddress(walletAddress)
        }
    }, [walletAddress, toAddress])

    const handleWalletConnect = async (walletType: 'metamask' | 'walletconnect') => {
        try {
            if (walletType === 'metamask') {
                // Check if MetaMask is installed
                if (typeof window.ethereum === 'undefined') {
                    addToast('MetaMask is not installed. Please install MetaMask extension.', 'error')
                    return
                }

                addToast('Connecting to MetaMask...', 'info')

                // Request account access
                const provider = new BrowserProvider(window.ethereum)
                const accounts = await provider.send('eth_requestAccounts', [])

                if (accounts && accounts.length > 0) {
                    const address = accounts[0]
                    setWalletAddress(address)
                    setIsWalletModalOpen(false)
                    addToast(ui_text.notifications.wallet_connected, 'success')

                    // Notify parent component
                    onWalletConnect?.(address)

                    // Fetch actual balance
                    try {
                        const balance = await provider.getBalance(address)
                        setBalance(formatEther(balance))
                    } catch (balanceError) {
                        console.error('Error fetching balance:', balanceError)
                    }
                } else {
                    addToast('No accounts found. Please unlock MetaMask.', 'error')
                }
            } else if (walletType === 'walletconnect') {
                // WalletConnect not yet implemented
                addToast('WalletConnect coming soon', 'info')
            }
        } catch (error: any) {
            console.error('Wallet connection error:', error)

            if (error.code === 4001) {
                addToast('Connection rejected by user', 'error')
            } else if (error.code === -32002) {
                addToast('Connection request already pending. Please check MetaMask.', 'error')
            } else {
                addToast('Failed to connect to MetaMask: ' + (error.message || 'Unknown error'), 'error')
            }
        }
    }

    const handleMaxClick = () => {
        setAmount(balance)
        setAmountError('')
    }

    const validateForm = (): boolean => {
        let isValid = true

        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            setAmountError('Please enter a valid amount')
            isValid = false
        } else if (parseFloat(amount) < parseFloat(validation.min_withdrawal_amount_eth)) {
            setAmountError(`Minimum withdrawal: ${validation.min_withdrawal_amount_eth} ETH`)
            isValid = false
        } else if (parseFloat(amount) > parseFloat(balance)) {
            setAmountError('Insufficient balance')
            isValid = false
        } else {
            setAmountError('')
        }

        // Validate address
        if (!toAddress) {
            setAddressError('Please enter a recipient address')
            isValid = false
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
            setAddressError('Invalid Ethereum address')
            isValid = false
        } else {
            setAddressError('')
        }

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }

        // Check if on correct network
        if (!isCorrectNetwork) {
            const result = await switchToNetwork(network_display.l2_chain_id)
            if (!result.success) {
                addToast(result.error || 'Failed to switch network', 'error')
                return
            }
            // Wait a bit for network switch to complete
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        setIsTransactionModalOpen(true)
    }

    const handleConfirmTransaction = async () => {
        setIsConfirming(true)
        addToast(ui_text.notifications.transaction_pending, 'info')

        try {
            // Initiate real withdrawal transaction
            const result = await initiateWithdrawal({
                amount,
                toAddress,
                l2BridgeAddress: bridge_contracts.l2_bridge.address
            })

            if (result.success && result.transactionHash) {
                setIsConfirming(false)
                setIsTransactionModalOpen(false)
                addToast(ui_text.notifications.transaction_confirmed, 'success')

                // Store withdrawal in localStorage for tracking
                const withdrawal: StoredWithdrawal = {
                    id: generateWithdrawalId(result.transactionHash, walletAddress),
                    transactionHash: result.transactionHash,
                    sourceNetwork: currentNetwork.network,
                    sourceChainId: network_display.l2_chain_id,
                    destinationNetwork: validation.destination_network.name,
                    destinationChainId: validation.destination_network.chain_id,
                    amount,
                    fromAddress: walletAddress,
                    toAddress,
                    l2BridgeAddress: bridge_contracts.l2_bridge.address,
                    l1PortalAddress: bridge_contracts.l1_portal?.address || '',
                    status: 'initiated',
                    currentStep: 1,
                    initiatedAt: Date.now()
                }

                const saved = saveWithdrawal(withdrawal)
                if (saved) {
                    console.log('Withdrawal saved:', withdrawal.id)
                } else {
                    console.error('Failed to save withdrawal')
                }

                // Reset form
                setAmount('')
                setToAddress(walletAddress)

                // Refresh balance
                try {
                    const provider = new BrowserProvider(window.ethereum!)
                    const balance = await provider.getBalance(walletAddress)
                    setBalance(formatEther(balance))
                } catch (balanceError) {
                    console.error('Error refreshing balance:', balanceError)
                }
            } else {
                setIsConfirming(false)
                addToast(result.error || 'Failed to initiate withdrawal', 'error')
            }
        } catch (error: any) {
            console.error('Transaction error:', error)
            setIsConfirming(false)
            addToast(error.message || 'Transaction failed', 'error')
        }
    }

    // Determine button state and text
    const getButtonState = () => {
        if (!walletAddress) {
            return {
                text: ui_text.button_states.connect_wallet,
                onClick: () => setIsWalletModalOpen(true),
                disabled: false
            }
        }
        if (!isCorrectNetwork) {
            return {
                text: `Switch to ${network_display.name}`,
                onClick: async () => {
                    const result = await switchToNetwork(network_display.l2_chain_id)
                    if (!result.success) {
                        addToast(result.error || 'Failed to switch network', 'error')
                    }
                },
                disabled: false
            }
        }
        if (!amount || !toAddress) {
            return {
                text: ui_text.button_states.enter_amount,
                onClick: handleSubmit,
                disabled: true
            }
        }
        return {
            text: ui_text.button_states.move_funds,
            onClick: handleSubmit,
            disabled: false
        }
    }

    const buttonState = getButtonState()

    return (
        <>
            <div className={styles.exitHatchForm}>
                <div className={styles.formSection}>
                    <label className={styles.label}>{ui_text.form_labels.from}</label>
                    <NetworkSelector
                        networks={allNetworks}
                        selectedNetwork={currentNetwork.network}
                        onNetworkChange={onNetworkChange}
                        disabled={!walletAddress}
                    />
                </div>

                <div className={styles.arrow}>→</div>

                <div className={styles.formSection}>
                    <label className={styles.label}>{ui_text.form_labels.to}</label>
                    <div className={styles.destinationNetwork}>
                        <div className={styles.networkIcon}>
                            <img src="/images/ethereum.png" alt="Ethereum" />
                        </div>
                        <span className={styles.networkName}>
                            {validation.destination_network.name}
                        </span>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <label className={styles.label}>{ui_text.form_labels.amount}</label>
                    <AmountInput
                        value={amount}
                        onChange={setAmount}
                        balance={balance}
                        symbol={supported_asset.symbol}
                        disabled={!walletAddress}
                        onMaxClick={handleMaxClick}
                        error={amountError}
                    />
                </div>

                <div className={styles.formSection}>
                    <label className={styles.label}>{ui_text.form_labels.to_address}</label>
                    <input
                        type="text"
                        className={`${styles.addressInput} ${addressError ? styles.error : ''}`}
                        value={toAddress}
                        onChange={(e) => {
                            setToAddress(e.target.value)
                            setAddressError('')
                        }}
                        placeholder="0x..."
                        disabled={!walletAddress}
                    />
                    {addressError && (
                        <div className={styles.errorMessage}>{addressError}</div>
                    )}
                </div>

                <button
                    className={`${styles.submitButton} ${buttonState.disabled ? styles.disabled : ''}`}
                    onClick={buttonState.onClick}
                    disabled={buttonState.disabled}
                    type="button"
                >
                    {buttonState.text}
                </button>

                {walletAddress && (
                    <div className={styles.walletInfo}>
                        <div>Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</div>
                        {!isCorrectNetwork && (
                            <div style={{ color: '#ff6b6b', marginTop: '4px', fontSize: '14px' }}>
                                ⚠️ Wrong network - Please switch to {network_display.name}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <WalletModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                onConnect={handleWalletConnect}
            />

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => !isConfirming && setIsTransactionModalOpen(false)}
                amount={amount}
                symbol={supported_asset.symbol}
                sourceNetwork={currentNetwork.network_display.name}
                recipientNetwork={validation.destination_network.name}
                estimatedTime={currentNetwork.withdrawal_flow.total_estimated_time}
                onConfirm={handleConfirmTransaction}
                isConfirming={isConfirming}
            />
        </>
    )
}

export default ExitHatchForm
