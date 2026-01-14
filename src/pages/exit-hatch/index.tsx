import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { isAddress, getAddress } from 'ethers'
import Layout from '@components/Layout'
import { Button } from '@components/Button/Button'
import { WalletConnectionModal } from '@components/Modals/WalletConnectionModal'
import { ConnectingWalletModal } from '@components/Modals/ConnectingWalletModal'
import { Toast } from '@components/Toast'
import { WalletAddressDropdown } from '@components/WalletAddressDropDown'
import { ConfirmationModal } from '@components/Modals/ConfirmationModal'
import { PendingTransactionsTab } from '@components/Tabs/PendingTransactionsTab'
import { HowItWorksTab } from '@components/Tabs/HowItWorksTab'
import { useWallet } from '@hooks/useWallet'
import { initiateWithdrawal, proveWithdrawal, finalizeWithdrawal } from '@services/withdrawalService'
import {
    saveWithdrawal,
    getAllWithdrawals,
    generateWithdrawalId,
    updateWithdrawalStatus
} from '@services/withdrawalStorage'
import { getWithdrawalStatus } from '@services/apiClient'
import { checkStateRootPublished, getWithdrawalMessage } from '@services/optimismApi'
import { StoredWithdrawal } from '../../types/withdrawal'
import { EXIT_HATCH_NETWORKS, ExitHatchNetwork } from '@data/networks'
import classNames from 'classnames'
import styles from './styles.module.scss'


interface Transaction {
    id: string
    amount: string
    token: string
    sourceNetwork: string
    recipientNetwork: string
    estimatedTime: string
    status: 'pending' | 'completed'
    pendingTime: string
    canClaim: boolean
    actionType?: 'prove' | 'finalize' | 'check'
    statusLabel?: string
    // Real withdrawal data
    transactionHash?: string
    withdrawalId?: string
}

// Sub-components
function PageHeader({
    onConnectWallet,
    isConnected,
    walletAddress,
    onDisconnect,
}: {
    onConnectWallet: () => void
    isConnected: boolean
    walletAddress: string
    onDisconnect: () => void
}) {
    return (
        <div className={styles.pageHeader}>
            {/* Left Content */}
            <div className={styles.headerContent}>
                <h1 className={styles.headerTitle}>EXIT HATCH</h1>
                <p className={styles.headerDescription}>
                    The Exit Hatch is your guaranteed safety mechanism. Initiate
                    a direct, forced withdrawal from any supported L2 back to
                    the Ethereum Mainnet, ensuring you retain full control over
                    your assets.
                </p>
            </div>

            {/* Right Content - Connect Wallet Button or Wallet Address */}
            <div className={styles.headerActions}>
                {isConnected ? (
                    <WalletAddressDropdown
                        address={walletAddress}
                        onDisconnect={onDisconnect}
                    />
                ) : (
                    <Button
                        variant="secondary"
                        size="M"
                        className={styles.fullWidthButton}
                        onClick={onConnectWallet}
                    >
                        Connect Wallet
                    </Button>
                )}
            </div>
        </div>
    )
}

function TabNavigation({
    activeTab,
    setActiveTab,
    claimableCount,
}: {
    activeTab: string
    setActiveTab: (tab: 'new' | 'pending' | 'how') => void
    claimableCount?: number
}) {
    const tabs = [
        { id: 'new' as const, label: 'New Withdrawal' },
        { id: 'pending' as const, label: 'Pending' },
        { id: 'how' as const, label: 'How It Works' },
    ]

    return (
        <div className={styles.tabNav}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classNames(styles.tabButton, {
                        [styles.tabButtonActive]: activeTab === tab.id,
                    })}
                >
                    {tab.label}
                    {tab.id === 'pending' &&
                        claimableCount &&
                        claimableCount > 0 && (
                            <div className={styles.tabBadge}>
                                {claimableCount > 9 ? '9+' : claimableCount}
                            </div>
                        )}
                </button>
            ))}
        </div>
    )
}

const TOKENS = [
    { id: 'eth', name: 'ETH', icon: '💎' },
]

function WithdrawalForm({
    onConnectWallet,
    isConnected,
    walletAddress,
    walletBalance,
    connectedChainId,
    onMoveFunds,
    onSwitchNetwork,
}: {
    onConnectWallet: () => void
    isConnected: boolean
    walletAddress: string
    walletBalance: string | null
    connectedChainId: number | null
    onMoveFunds: (txDetails: any) => void
    onSwitchNetwork: (chainId: number) => Promise<boolean>
}) {
    const [amount, setAmount] = useState('')
    const [address, setAddress] = useState('')

    // Prefill address with connected wallet address
    useEffect(() => {
        if (isConnected && walletAddress) {
            setAddress(walletAddress)
        } else {
            setAddress('')
        }
    }, [isConnected, walletAddress])
    const [isAmountFocused, setIsAmountFocused] = useState(false)
    const [isAmountHovered, setIsAmountHovered] = useState(false)
    const [isAddressFocused, setIsAddressFocused] = useState(false)
    const [isAddressHovered, setIsAddressHovered] = useState(false)
    const [isNetworkHovered, setIsNetworkHovered] = useState(false)
    const [isNetworkOpen, setIsNetworkOpen] = useState(false)
    const [isTokenOpen, setIsTokenOpen] = useState(false)
    const [isTokenHovered, setIsTokenHovered] = useState(false)
    const [selectedNetwork, setSelectedNetwork] = useState<
        (typeof EXIT_HATCH_NETWORKS)[0] | null
    >(null)
    const [selectedToken, setSelectedToken] = useState(TOKENS[0])

    const networkRef = useRef<HTMLDivElement>(null)
    const tokenRef = useRef<HTMLDivElement>(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                networkRef.current &&
                !networkRef.current.contains(event.target as Node)
            ) {
                setIsNetworkOpen(false)
            }
            if (
                tokenRef.current &&
                !tokenRef.current.contains(event.target as Node)
            ) {
                setIsTokenOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Use real wallet balance for ETH
    const balance = walletBalance ? parseFloat(walletBalance) : 0
    const numAmount = parseFloat(amount) || 0
    const hasInsufficient = numAmount > balance && numAmount > 0

    // Address validation
    const addressValidation = useMemo(() => {
        if (!address) {
            return { isValid: false, error: null, isDifferentFromWallet: false }
        }
        // Check if it's a valid Ethereum address
        if (!isAddress(address)) {
            return { isValid: false, error: 'Invalid Ethereum address format', isDifferentFromWallet: false }
        }
        // Get checksummed version for comparison
        const checksummedAddress = getAddress(address)
        const isDifferent = isConnected && walletAddress && checksummedAddress.toLowerCase() !== walletAddress.toLowerCase()
        return { isValid: true, error: null, isDifferentFromWallet: isDifferent }
    }, [address, isConnected, walletAddress])

    const isDisabled =
        !isConnected ||
        numAmount === 0 ||
        hasInsufficient ||
        !address ||
        !addressValidation.isValid ||
        !selectedNetwork

    // Generate transaction details for confirmation
    const generateTransactionDetails = () => {
        if (!selectedNetwork || !numAmount || !address) {
            return {
                withdrawnAmount: '-',
                sourceNetwork: '-',
                recipientNetwork: '-',
                estimatedTime: '-',
                transactionId: '-',
                // Contract details for execution
                network: null,
                amount: '',
                toAddress: '',
            }
        }

        // Challenge period from network config
        const estimatedDays = selectedNetwork.challengePeriodDays

        return {
            withdrawnAmount: `${numAmount} ${selectedToken.name}`,
            sourceNetwork: selectedNetwork.name,
            recipientNetwork: selectedNetwork.isTestnet ? 'Ethereum Sepolia' : 'Ethereum',
            estimatedTime: `${estimatedDays} Day${estimatedDays > 1 ? 's' : ''}`,
            transactionId: 'Pending...',
            // Contract details for execution
            network: selectedNetwork,
            amount: amount,
            toAddress: address,
        }
    }

    const txDetails = generateTransactionDetails()

    return (
        <div className={styles.formContainer}>
            {/* Left Content - Form Inputs */}
            <div className={styles.formLeft}>
                {/* From/To Section */}
                <div className={styles.fromToSection}>
                    {/* From Network Selector */}
                    <div
                        ref={networkRef}
                        className={styles.networkSelectorContainer}
                    >
                        <label className={styles.inputLabel}>From</label>
                        <button
                            onClick={() => setIsNetworkOpen(!isNetworkOpen)}
                            onMouseEnter={() => setIsNetworkHovered(true)}
                            onMouseLeave={() => setIsNetworkHovered(false)}
                            className={classNames(styles.networkButton, {
                                [styles.networkButtonActive]:
                                    isNetworkHovered || isNetworkOpen,
                            })}
                        >
                            {selectedNetwork ? (
                                <div className={styles.networkButtonContent}>
                                    <img
                                        src={selectedNetwork.icon}
                                        alt={selectedNetwork.name}
                                        className={styles.networkIcon}
                                    />
                                    <span className={styles.networkName}>
                                        {selectedNetwork.name}
                                    </span>
                                </div>
                            ) : (
                                <span className={styles.networkPlaceholder}>
                                    Select Network
                                </span>
                            )}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                className={classNames(styles.chevron, {
                                    [styles.chevronRotated]: isNetworkOpen,
                                })}
                            >
                                <path
                                    d="M4 6L8 10L12 6"
                                    className={classNames(styles.chevronPath, {
                                        [styles.chevronPathActive]:
                                            isNetworkHovered || isNetworkOpen,
                                    })}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* Network Dropdown */}
                        {isNetworkOpen && (
                            <div className={styles.networkDropdown}>
                                {EXIT_HATCH_NETWORKS.map((network) => (
                                    <button
                                        key={network.id}
                                        onClick={async () => {
                                            setSelectedNetwork(network)
                                            setIsNetworkOpen(false)
                                            if (isConnected && connectedChainId !== network.chainId) {
                                                await onSwitchNetwork(network.chainId)
                                            }
                                        }}
                                        className={classNames(
                                            styles.networkOption,
                                            {
                                                [styles.networkOptionSelected]:
                                                    selectedNetwork?.id ===
                                                    network.id,
                                            }
                                        )}
                                    >
                                        <img
                                            src={network.icon}
                                            alt={network.name}
                                            className={styles.networkIcon}
                                        />
                                        <span className={styles.networkName}>
                                            {network.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Arrow Icon */}
                    <div className={styles.arrowContainer}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className={styles.arrowIcon}
                        >
                            <path
                                d="M2 8H14M14 8L10 4M14 8L10 12"
                                className={styles.arrowPath}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* To Ethereum (Fixed) */}
                    <div className={styles.toNetwork}>
                        <label className={styles.inputLabel}>To</label>
                        <div className={styles.toNetworkDisplay}>
                            <img
                                src="/images/ethereum.png"
                                alt={selectedNetwork?.isTestnet ? 'Ethereum Sepolia' : 'Ethereum'}
                                className={styles.networkIcon}
                            />
                            <span className={styles.ethereumText}>
                                {selectedNetwork?.isTestnet ? 'Ethereum Sepolia' : 'Ethereum'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Amount Input */}
                <div className={styles.amountSection}>
                    <label className={styles.inputLabel}>Amount</label>
                    <div
                        className={classNames(styles.amountInputContainer, {
                            [styles.amountInputContainerError]: hasInsufficient,
                            [styles.amountInputContainerFocused]:
                                isAmountFocused || isAmountHovered,
                        })}
                        onMouseEnter={() => setIsAmountHovered(true)}
                        onMouseLeave={() => setIsAmountHovered(false)}
                    >
                        <div className={styles.amountInputTop}>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onFocus={() => setIsAmountFocused(true)}
                                onBlur={() => setIsAmountFocused(false)}
                                placeholder="0"
                                className={styles.amountInput}
                            />

                            {/* Token Selector */}
                            <div ref={tokenRef} className={styles.tokenSelector}>
                                <button
                                    onClick={() => setIsTokenOpen(!isTokenOpen)}
                                    onMouseEnter={() => setIsTokenHovered(true)}
                                    onMouseLeave={() => setIsTokenHovered(false)}
                                    className={styles.tokenButton}
                                >
                                    <span className={styles.tokenIcon}>
                                        {selectedToken.icon}
                                    </span>
                                    <span
                                        className={classNames(styles.tokenName, {
                                            [styles.tokenNameHovered]:
                                                isTokenHovered,
                                        })}
                                    >
                                        {selectedToken.name}
                                    </span>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        className={classNames(styles.chevron, {
                                            [styles.chevronRotated]: isTokenOpen,
                                        })}
                                    >
                                        <path
                                            d="M4 6L8 10L12 6"
                                            className={classNames(
                                                styles.chevronPath,
                                                {
                                                    [styles.chevronPathActive]:
                                                        isTokenHovered,
                                                }
                                            )}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {/* Token Dropdown */}
                                {isTokenOpen && (
                                    <div className={styles.tokenDropdown}>
                                        <div
                                            className={styles.tokenDropdownLabel}
                                        >
                                            Available for withdraw
                                        </div>
                                        {TOKENS.map((token) => (
                                            <button
                                                key={token.id}
                                                onClick={() => {
                                                    setSelectedToken(token)
                                                    setIsTokenOpen(false)
                                                    setAmount('') // Reset amount when changing token
                                                }}
                                                className={classNames(
                                                    styles.tokenOption,
                                                    {
                                                        [styles.tokenOptionSelected]:
                                                            selectedToken.id ===
                                                            token.id,
                                                    }
                                                )}
                                            >
                                                <span
                                                    className={
                                                        styles.tokenOptionIcon
                                                    }
                                                >
                                                    {token.icon}
                                                </span>
                                                <span
                                                    className={
                                                        styles.tokenOptionName
                                                    }
                                                >
                                                    {token.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.amountInputBottom}>
                            <div />
                            <div className={styles.balanceInfo}>
                                <span
                                    className={classNames(styles.balanceText, {
                                        [styles.balanceTextError]:
                                            hasInsufficient,
                                    })}
                                >
                                    Balance: {balance} {selectedToken.name}
                                </span>
                                <button
                                    className={styles.maxButton}
                                    onClick={() =>
                                        setAmount(balance.toString())
                                    }
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    </div>
                    {hasInsufficient && (
                        <p className={styles.errorText}>Insufficient funds.</p>
                    )}
                </div>

                {/* Address Input */}
                <div className={styles.addressSection}>
                    <label className={styles.inputLabel}>Address</label>
                    <div
                        className={classNames(styles.addressInputContainer, {
                            [styles.addressInputContainerFocused]:
                                isAddressFocused || isAddressHovered,
                            [styles.addressInputContainerError]:
                                address && !addressValidation.isValid,
                        })}
                        onMouseEnter={() => setIsAddressHovered(true)}
                        onMouseLeave={() => setIsAddressHovered(false)}
                    >
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onFocus={() => setIsAddressFocused(true)}
                            onBlur={() => setIsAddressFocused(false)}
                            placeholder="Enter wallet address"
                            className={styles.addressInput}
                        />
                    </div>
                    {address && !addressValidation.isValid && addressValidation.error && (
                        <p className={styles.errorText}>{addressValidation.error}</p>
                    )}
                    {addressValidation.isDifferentFromWallet && (
                        <div className={styles.addressWarning}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
                            </svg>
                            <span>This address differs from your connected wallet. Funds will be sent to a different address.</span>
                        </div>
                    )}
                </div>

                {/* Mobile: Move Funds Button */}
                <div className={styles.mobileButtonContainer}>
                    {isConnected ? (
                        <Button
                            variant="secondary"
                            className={classNames(styles.fullWidthButton, {
                                [styles.buttonDisabled]: isDisabled,
                            })}
                            onClick={() => !isDisabled && onMoveFunds(txDetails)}
                        >
                            Move Funds
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            className={styles.fullWidthButton}
                            onClick={onConnectWallet}
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </div>

            {/* Separator - Desktop only */}
            <div className={styles.formSeparator} />

            {/* Right Content - Transaction Details - Desktop only */}
            <div className={styles.formRight}>
                <div className={styles.txDetailsContainer}>
                    <h3 className={styles.txDetailsTitle}>
                        Transaction Details
                    </h3>

                    <div className={styles.txDetailsRows}>
                        <div className={styles.txDetailsRow}>
                            <span className={styles.txDetailsLabel}>
                                Withdrawn Amount
                            </span>
                            <div className={styles.txDetailsValueContainer}>
                                <span className={styles.txDetailsValue}>
                                    {txDetails.withdrawnAmount}
                                </span>
                            </div>
                        </div>
                        <div className={styles.txDetailsRow}>
                            <span className={styles.txDetailsLabel}>
                                Source Network (L2)
                            </span>
                            <span className={styles.txDetailsValue}>
                                {txDetails.sourceNetwork}
                            </span>
                        </div>
                        <div className={styles.txDetailsRow}>
                            <span className={styles.txDetailsLabel}>
                                Recipient Network (L1)
                            </span>
                            <span className={styles.txDetailsValue}>
                                {txDetails.recipientNetwork}
                            </span>
                        </div>
                        <div className={styles.txDetailsRow}>
                            <span className={styles.txDetailsLabel}>
                                Estimated Time to Completion
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <circle
                                        cx="8"
                                        cy="8"
                                        r="6.5"
                                        className={styles.clockIcon}
                                        strokeWidth="1"
                                    />
                                    <path
                                        d="M8 5V8L10 10"
                                        className={styles.clockIcon}
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                            <span className={styles.txDetailsValue}>
                                {txDetails.estimatedTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Desktop: Connect Wallet or Move Funds Button */}
                <div className={styles.desktopButtonContainer}>
                    {isConnected ? (
                        <Button
                            variant="secondary"
                            className={classNames(styles.fullWidthButton, {
                                [styles.buttonDisabled]: isDisabled,
                            })}
                            onClick={() => !isDisabled && onMoveFunds(txDetails)}
                        >
                            Move Funds
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            className={styles.fullWidthButton}
                            onClick={onConnectWallet}
                        >
                            Connect Wallet
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Export sub-components for use in App.tsx
export { PageHeader, TabNavigation, WithdrawalForm }

// Count claimable transactions
const countClaimableTransactions = (transactions: Transaction[]): number => {
    return transactions.filter((tx) => tx.canClaim).length
}

// Convert stored withdrawals to Transaction format for UI
const convertWithdrawalsToTransactions = (withdrawals: StoredWithdrawal[]): Transaction[] => {
    return withdrawals
        .filter(w => w.status !== 'finalized' && w.status !== 'completed')
        .map(w => {
            // Calculate pending time
            const now = Date.now()
            const initiatedAt = w.initiatedAt || w.createdAt || now
            const elapsed = now - initiatedAt
            const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24))
            const elapsedHours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const elapsedMinutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))

            // Determine action type, status label, and whether user can act based on withdrawal step
            // Flow: initiated → wait_state_root → ready_to_prove → proven → wait_challenge → ready_to_finalize → finalized
            let canClaim = false
            let actionType: 'prove' | 'finalize' | 'check' | undefined
            let statusLabel: string | undefined

            if (w.status === 'initiated') {
                canClaim = true
                actionType = 'prove'
                statusLabel = 'Withdrawal Initiated'
            } else if (w.status === 'waiting_state_root') {
                canClaim = true
                actionType = 'prove'
                statusLabel = 'State Root: Pending'
            } else if (w.status === 'ready_to_prove') {
                canClaim = true
                actionType = 'prove'
                statusLabel = 'State Root: Published'
            } else if (w.status === 'proven') {
                canClaim = false
                actionType = undefined
                statusLabel = 'Proof Submitted'
            } else if (w.status === 'waiting_challenge') {
                canClaim = false
                actionType = undefined
                statusLabel = 'Challenge Period'
            } else if (w.status === 'ready_to_finalize' || w.status === 'ready_to_execute') {
                canClaim = true
                actionType = 'finalize'
                statusLabel = 'Ready to Finalize'
            }

            return {
                id: `${w.transactionHash.slice(0, 10)}...${w.transactionHash.slice(-6)}`,
                amount: w.amount,
                token: 'ETH',
                sourceNetwork: w.sourceNetwork || 'Unknown',
                recipientNetwork: w.destinationNetwork || 'Ethereum',
                estimatedTime: '7 Days',
                status: 'pending' as const,
                pendingTime: `${elapsedDays}d ${elapsedHours}h ${elapsedMinutes}m`,
                canClaim,
                actionType,
                statusLabel,
                transactionHash: w.transactionHash,
                withdrawalId: w.id,
            }
        })
}

export function ExitHatchPage() {
    const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'how'>('new')
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
    const [connectingWallet, setConnectingWallet] = useState<string>('')
    const [showWalletToast, setShowWalletToast] = useState(false)
    const [showWalletErrorToast, setShowWalletErrorToast] = useState(false)
    const [walletErrorMessage, setWalletErrorMessage] = useState('')
    const [showTransactionToast, setShowTransactionToast] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [pendingTransactions, setPendingTransactions] = useState<
        Transaction[]
    >([])
    const [pendingTxDetails, setPendingTxDetails] = useState<any>(null)
    const [showClaimToast, setShowClaimToast] = useState(false)
    const [showInfoToast, setShowInfoToast] = useState(false)
    const [infoToastMessage, setInfoToastMessage] = useState('')
    const [submittingTxIds, setSubmittingTxIds] = useState<Set<string>>(
        new Set()
    )

    // Use the real wallet hook
    const {
        isConnected,
        isConnecting,
        address: walletAddress,
        balance: walletBalance,
        chainId: connectedChainId,
        error: walletError,
        connect,
        disconnect,
        switchNetwork,
        formatAddress,
    } = useWallet()

    // Load withdrawals from storage on mount and when wallet connects
    const loadWithdrawals = useCallback(() => {
        const storedWithdrawals = getAllWithdrawals()
        // Filter by current wallet if connected
        const filteredWithdrawals = walletAddress
            ? storedWithdrawals.filter(w =>
                w.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
              )
            : storedWithdrawals
        const transactions = convertWithdrawalsToTransactions(filteredWithdrawals)
        setPendingTransactions(transactions)
    }, [walletAddress])

    useEffect(() => {
        loadWithdrawals()
    }, [loadWithdrawals])

    // Refresh withdrawals periodically to update status
    useEffect(() => {
        if (!isConnected) return

        const interval = setInterval(() => {
            loadWithdrawals()
        }, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [isConnected, loadWithdrawals])

    // Auto-check state root status for OP Stack withdrawals via L1 RPC
    useEffect(() => {
        if (!isConnected || activeTab !== 'pending') return

        let cancelled = false

        const checkStateRoots = async () => {
            const storedWithdrawals = getAllWithdrawals()
            const pending = storedWithdrawals.filter(w =>
                (w.status === 'initiated' || w.status === 'waiting_state_root') &&
                w.rollupType !== 'arbitrum' &&
                w.l1PortalAddress
            )

            if (pending.length === 0) return

            for (const w of pending) {
                if (cancelled) break

                const messageResult = await getWithdrawalMessage(w.transactionHash, w.sourceChainId)
                if (!messageResult.success || !messageResult.message) continue

                const result = await checkStateRootPublished(
                    messageResult.message.blockNumber,
                    w.sourceChainId,
                    w.destinationChainId || w.targetChainId,
                    w.l1PortalAddress
                )

                if (result.published && !cancelled) {
                    updateWithdrawalStatus(w.id, 'ready_to_prove', {
                        stateRootPublishedAt: Date.now(),
                        currentStep: 3,
                    })
                }
            }

            if (!cancelled) {
                loadWithdrawals()
            }
        }

        checkStateRoots()
        const interval = setInterval(checkStateRoots, 60000) // Re-check every 60 seconds

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [isConnected, activeTab, loadWithdrawals])

    const handleConnectWallet = () => {
        setIsWalletModalOpen(true)
    }

    const handleWalletConnect = async (walletId: string) => {
        // Close wallet selection modal
        setIsWalletModalOpen(false)

        // Set connecting wallet for UI display
        setConnectingWallet(walletId)

        // Connect to the wallet - this will trigger MetaMask popup
        const success = await connect(walletId as 'metamask' | 'walletconnect')

        if (success) {
            setShowWalletToast(true)
        }
    }

    // Show error toast when wallet connection fails
    useEffect(() => {
        if (walletError) {
            setWalletErrorMessage(walletError)
            setShowWalletErrorToast(true)
        }
    }, [walletError])

    const handleDisconnect = () => {
        disconnect()
    }

    const handleMoveFunds = (txDetails: any) => {
        setPendingTxDetails(txDetails)
        setShowConfirmModal(true)
    }

    const handleConfirm = async () => {
        if (!pendingTxDetails || !pendingTxDetails.network || !walletAddress) {
            return
        }

        const network = pendingTxDetails.network
        setIsConfirming(true)

        try {
            // Check if user is on the correct network
            if (connectedChainId !== network.chainId) {
                // Switch to the correct network
                const switched = await switchNetwork(network.chainId)
                if (!switched) {
                    throw new Error(`Please switch to ${network.name} network`)
                }
                // Wait for network switch to complete
                await new Promise(resolve => setTimeout(resolve, 1000))

                // Verify chain ID after switch by checking with provider
                if (typeof window !== 'undefined' && window.ethereum) {
                    const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
                    const currentChainId = parseInt(currentChainIdHex as string, 16)
                    if (currentChainId !== network.chainId) {
                        throw new Error(`Network switch failed. Expected chain ${network.chainId} but got ${currentChainId}. Please try again.`)
                    }
                }
            }

            // Call the real contract to initiate withdrawal
            // This will prompt MetaMask for transaction signature
            const result = await initiateWithdrawal({
                amount: pendingTxDetails.amount,
                toAddress: pendingTxDetails.toAddress,
                l2BridgeAddress: network.l2BridgeAddress || network.arbSysAddress,
            })

            if (!result.success) {
                throw new Error(result.error || 'Withdrawal failed')
            }

            // Store the withdrawal in localStorage
            const withdrawalId = generateWithdrawalId(result.transactionHash!, walletAddress)
            const estimatedDays = network.challengePeriodDays
            const challengePeriodMs = estimatedDays * 24 * 60 * 60 * 1000

            const storedWithdrawal: StoredWithdrawal = {
                id: withdrawalId,
                transactionHash: result.transactionHash!,
                rollupType: network.rollupType,
                sourceNetwork: network.name,
                sourceChainId: network.chainId,
                destinationNetwork: network.isTestnet ? 'Ethereum Sepolia' : 'Ethereum',
                destinationChainId: network.l1ChainId,
                amount: pendingTxDetails.amount,
                fromAddress: walletAddress,
                toAddress: pendingTxDetails.toAddress,
                l2BridgeAddress: network.l2BridgeAddress,
                l1PortalAddress: network.l1PortalAddress,
                arbSysAddress: network.arbSysAddress,
                outboxAddress: network.outboxAddress,
                status: 'initiated',
                currentStep: 1,
                initiatedAt: Date.now(),
                challengePeriodEndsAt: Date.now() + challengePeriodMs,
            }

            saveWithdrawal(storedWithdrawal)

            // Add to UI pending list
            const newTransaction: Transaction = {
                id: `${result.transactionHash!.slice(0, 10)}...${result.transactionHash!.slice(-6)}`,
                amount: pendingTxDetails.amount,
                token: 'ETH',
                sourceNetwork: network.name,
                recipientNetwork: network.isTestnet ? 'Ethereum Sepolia' : 'Ethereum',
                estimatedTime: `${estimatedDays} Day${estimatedDays > 1 ? 's' : ''}`,
                status: 'pending',
                pendingTime: `${estimatedDays}d 0h 0m`,
                canClaim: false,
                transactionHash: result.transactionHash,
                withdrawalId: withdrawalId,
            }
            setPendingTransactions((prev) => [newTransaction, ...prev])

            setIsConfirming(false)
            setShowConfirmModal(false)
            setShowTransactionToast(true)

        } catch (error: any) {
            console.error('Withdrawal error:', error)
            setIsConfirming(false)
            setWalletErrorMessage(error.message || 'Transaction failed')
            setShowWalletErrorToast(true)
        }
    }

    const handleViewPending = () => {
        setActiveTab('pending')
        setShowTransactionToast(false)
    }

    const handleClaimTransaction = async (txId: string) => {
        // Find the transaction to get the withdrawal details
        const transaction = pendingTransactions.find(tx => tx.id === txId)
        if (!transaction || !transaction.withdrawalId) {
            setWalletErrorMessage('Withdrawal details not found')
            setShowWalletErrorToast(true)
            return
        }

        // Get the stored withdrawal
        const storedWithdrawals = getAllWithdrawals()
        const withdrawal = storedWithdrawals.find(w => w.id === transaction.withdrawalId)
        if (!withdrawal) {
            setWalletErrorMessage('Withdrawal not found in storage')
            setShowWalletErrorToast(true)
            return
        }

        if (!withdrawal.l1PortalAddress) {
            setWalletErrorMessage('L1 portal address not found for this withdrawal')
            setShowWalletErrorToast(true)
            return
        }

        // Add to submitting set
        setSubmittingTxIds((prev) => new Set(prev).add(txId))

        try {
            const l1ChainId = withdrawal.destinationChainId || 1
            const l2ChainId = withdrawal.sourceChainId

            // Check withdrawal status from the server
            const statusResult = await getWithdrawalStatus(
                withdrawal.transactionHash,
                l2ChainId,
                l1ChainId
            )

            if (!statusResult.success || !statusResult.data) {
                throw new Error(statusResult.error || 'Failed to check withdrawal status')
            }

            const status = statusResult.data

            if (status.ready) {
                // Ready to prove — submit proof on L1
                const proveResult = await proveWithdrawal(
                    withdrawal.transactionHash,
                    withdrawal.l1PortalAddress,
                    l2ChainId,
                    l1ChainId
                )

                if (!proveResult.success) {
                    throw new Error(proveResult.error || 'Failed to prove withdrawal')
                }

                updateWithdrawalStatus(withdrawal.id, 'proven', {
                    stateRootPublishedAt: Date.now(),
                    provenAt: Date.now(),
                    proveTransactionHash: proveResult.transactionHash,
                    currentStep: 4
                })
                setShowClaimToast(true)
            } else if (status.readyToFinalize) {
                // Ready to finalize — call finalize on L1
                const finalizeResult = await finalizeWithdrawal(
                    withdrawal.transactionHash,
                    withdrawal.l1PortalAddress,
                    l2ChainId,
                    l1ChainId
                )

                if (!finalizeResult.success) {
                    throw new Error(finalizeResult.error || 'Failed to finalize withdrawal')
                }

                updateWithdrawalStatus(withdrawal.id, 'finalized', {
                    finalizedAt: Date.now(),
                    finalizeTransactionHash: finalizeResult.transactionHash,
                    currentStep: 5
                })
                setShowClaimToast(true)
            } else {
                // Not ready yet — update local status and show info message
                if (status.status === 'STATE_ROOT_NOT_PUBLISHED') {
                    updateWithdrawalStatus(withdrawal.id, 'waiting_state_root', {
                        currentStep: 2
                    })
                    setInfoToastMessage('Waiting for the state root to be published to L1. This usually takes about 1 hour.')
                } else if (status.status === 'IN_CHALLENGE_PERIOD') {
                    updateWithdrawalStatus(withdrawal.id, 'waiting_challenge', {
                        currentStep: 4
                    })
                    setInfoToastMessage('Challenge period in progress. Please wait for it to complete before finalizing.')
                } else {
                    setInfoToastMessage(`Withdrawal status: ${status.status}. Not ready for next step yet.`)
                }
                setShowInfoToast(true)
            }

            // Reload withdrawals to reflect new status
            loadWithdrawals()

        } catch (error: any) {
            console.error('Claim transaction error:', error)
            setWalletErrorMessage(error.message || 'Failed to process claim')
            setShowWalletErrorToast(true)
        } finally {
            // Remove from submitting set
            setSubmittingTxIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(txId)
                return newSet
            })
        }
    }

    return (
        <Layout>
            {/* Main Content */}
            <div className={styles.pageContainer}>
                <PageHeader
                    onConnectWallet={handleConnectWallet}
                    isConnected={isConnected}
                    walletAddress={walletAddress ? formatAddress(walletAddress) : ''}
                    onDisconnect={handleDisconnect}
                />
                <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    claimableCount={
                        isConnected
                            ? countClaimableTransactions(pendingTransactions)
                            : undefined
                    }
                />

                {activeTab === 'new' && (
                    <WithdrawalForm
                        onConnectWallet={handleConnectWallet}
                        isConnected={isConnected}
                        walletAddress={walletAddress || ''}
                        walletBalance={walletBalance}
                        connectedChainId={connectedChainId}
                        onMoveFunds={handleMoveFunds}
                        onSwitchNetwork={switchNetwork}
                    />
                )}

                {activeTab === 'pending' && (
                    <PendingTransactionsTab
                        isConnected={isConnected}
                        transactions={pendingTransactions}
                        onConnectWallet={handleConnectWallet}
                        onClaimTransaction={handleClaimTransaction}
                        submittingTxIds={submittingTxIds}
                    />
                )}

                {activeTab === 'how' && (
                    <HowItWorksTab isConnected={isConnected} />
                )}
            </div>

            {/* Wallet Selection Modal */}
            <WalletConnectionModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                onConnect={handleWalletConnect}
            />

            {/* Connecting Modal */}
            <ConnectingWalletModal
                isOpen={isConnecting}
                walletName={connectingWallet}
            />

            {/* Confirmation Modal */}
            {pendingTxDetails && (
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => !isConfirming && setShowConfirmModal(false)}
                    onConfirm={handleConfirm}
                    isLoading={isConfirming}
                    txDetails={pendingTxDetails}
                />
            )}

            {/* Wallet Connection Toast */}
            <Toast
                isOpen={showWalletToast}
                message="Wallet connected successfully"
                type="success"
                onClose={() => setShowWalletToast(false)}
            />

            {/* Transaction Success Toast */}
            <Toast
                isOpen={showTransactionToast}
                message="Transaction submitted successfully"
                type="success"
                onClose={() => setShowTransactionToast(false)}
                actionLabel="View Pending"
                onAction={handleViewPending}
            />

            {/* Claim Success Toast */}
            <Toast
                isOpen={showClaimToast}
                message="Transaction Submitted"
                description="Your Transaction was Submitted Successfully"
                type="success"
                onClose={() => setShowClaimToast(false)}
            />

            {/* Wallet Error Toast */}
            <Toast
                isOpen={showWalletErrorToast}
                message="Wallet Connection Failed"
                description={walletErrorMessage}
                type="error"
                onClose={() => setShowWalletErrorToast(false)}
            />

            {/* Withdrawal Status Info Toast */}
            <Toast
                isOpen={showInfoToast}
                message="Withdrawal Status"
                description={infoToastMessage}
                type="info"
                onClose={() => setShowInfoToast(false)}
            />
        </Layout>
    )
}

export default ExitHatchPage
