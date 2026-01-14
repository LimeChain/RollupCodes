import { Wallet, ExternalLink, ArrowLeftRight, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import classNames from 'classnames'
import { getNetworkFilterOptions } from '@data/networks'
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
}

interface PendingTransactionsTabProps {
    isConnected: boolean
    transactions: Transaction[]
    onConnectWallet: () => void
    onClaimTransaction: (txId: string) => void
    submittingTxIds: Set<string>
}

export function PendingTransactionsTab({
    isConnected,
    transactions,
    onClaimTransaction,
    submittingTxIds,
}: PendingTransactionsTabProps) {
    // Get network filter options from shared config (includes testnets for filtering)
    const NETWORKS = useMemo(() => getNetworkFilterOptions(true), [])
    const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0])
    const [isNetworkOpen, setIsNetworkOpen] = useState(false)
    const [isNetworkHovered, setIsNetworkHovered] = useState(false)
    const [isNetworkFocused, setIsNetworkFocused] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const networkRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                networkRef.current &&
                !networkRef.current.contains(event.target as Node)
            ) {
                setIsNetworkOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCopyTxId = (txId: string) => {
        navigator.clipboard.writeText(txId)
    }

    // Filter and sort transactions by selected network
    let filteredTransactions = transactions.filter((tx) =>
        tx.sourceNetwork
            .toLowerCase()
            .includes(selectedNetwork.name.toLowerCase().split(' ')[0])
    )

    // Sort: claimable transactions first
    filteredTransactions = [...filteredTransactions].sort((a, b) => {
        if (a.canClaim && !b.canClaim) return -1
        if (!a.canClaim && b.canClaim) return 1
        return 0
    })

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

    // Reset to page 1 when network filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedNetwork])

    // Pagination controls component
    const PaginationControls = () => {
        if (totalPages <= 1) return null

        return (
            <nav aria-label="Pagination" className={styles.pagination}>
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    aria-label="Go to previous page"
                    className={styles.paginationButton}
                >
                    Previous
                </button>

                <div
                    className={styles.paginationNumbers}
                    role="group"
                    aria-label="Page numbers"
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                aria-label={`Go to page ${page}`}
                                aria-current={
                                    currentPage === page ? 'page' : undefined
                                }
                                className={classNames(styles.paginationNumber, {
                                    [styles.paginationNumberActive]:
                                        currentPage === page,
                                })}
                            >
                                {page}
                            </button>
                        )
                    )}
                </div>

                <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Go to next page"
                    className={styles.paginationButton}
                >
                    Next
                </button>
            </nav>
        )
    }

    // Network Selector Component (reused across states)
    const NetworkSelector = () => (
        <div ref={networkRef} className={styles.networkSelector}>
            <label htmlFor="network-selector" className={styles.networkLabel}>
                From
            </label>
            <button
                id="network-selector"
                onClick={() => setIsNetworkOpen(!isNetworkOpen)}
                onMouseEnter={() => setIsNetworkHovered(true)}
                onMouseLeave={() => setIsNetworkHovered(false)}
                onFocus={() => setIsNetworkFocused(true)}
                onBlur={() => setIsNetworkFocused(false)}
                className={classNames(styles.networkButton, {
                    [styles.open]:
                        isNetworkHovered || isNetworkOpen || isNetworkFocused,
                })}
                aria-label={`Select network, currently ${selectedNetwork.name}`}
                aria-expanded={isNetworkOpen}
                aria-haspopup="listbox"
            >
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
                <div
                    role="listbox"
                    aria-label="Select network"
                    className={styles.networkDropdown}
                >
                    {NETWORKS.map((network) => (
                        <button
                            key={network.id}
                            role="option"
                            aria-selected={selectedNetwork.id === network.id}
                            onClick={() => {
                                setSelectedNetwork(network)
                                setIsNetworkOpen(false)
                            }}
                            className={classNames(styles.networkOption, {
                                [styles.selected]:
                                    selectedNetwork.id === network.id,
                            })}
                        >
                            <img
                                src={network.icon}
                                alt={network.name}
                                className={styles.networkIcon}
                                aria-hidden="true"
                            />
                            <span className={styles.networkName}>
                                {network.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    // Wallet not connected state
    if (!isConnected) {
        return (
            <div
                className={classNames(
                    styles.container,
                    styles.containerMinHeight
                )}
            >
                <div className={styles.emptyState}>
                    <Wallet className={styles.emptyIcon} />
                    <p className={styles.emptyText}>No Wallet Connected</p>
                </div>
            </div>
        )
    }

    // Empty state
    if (filteredTransactions.length === 0) {
        return (
            <div
                className={classNames(
                    styles.container,
                    styles.containerMinHeight
                )}
            >
                <NetworkSelector />
                <div className={styles.emptyState}>
                    <ArrowLeftRight
                        className={styles.emptyIcon}
                        strokeWidth={1.5}
                    />
                    <p className={styles.emptyText}>
                        No Pending Transactions Found
                    </p>
                </div>
            </div>
        )
    }

    // Transactions table
    return (
        <div
            className={classNames(styles.container, styles.containerMinHeight)}
        >
            <NetworkSelector />

            <div
                className={styles.tableContainer}
                role="table"
                aria-label="Pending transactions"
            >
                {/* Table Header - Desktop only */}
                <div className={styles.tableHeader} role="row">
                    <div
                        className={classNames(
                            styles.tableHeaderCol,
                            styles.tableHeaderColFlex
                        )}
                        role="columnheader"
                    >
                        Transaction ID
                    </div>
                    <div
                        className={classNames(
                            styles.tableHeaderCol,
                            styles.tableHeaderColFixed
                        )}
                        role="columnheader"
                    >
                        L2
                    </div>
                    <div
                        className={classNames(
                            styles.tableHeaderCol,
                            styles.tableHeaderColFlex
                        )}
                        role="columnheader"
                    >
                        Status
                    </div>
                    <div
                        className={styles.tableHeaderColFixed}
                        role="columnheader"
                    >
                        <span className={styles.srOnly}>Actions</span>
                    </div>
                </div>

                {/* Table Rows */}
                {paginatedTransactions.map((tx) => (
                    <div key={tx.id} role="row" className={styles.tableRow}>
                        {/* Desktop Layout */}
                        <div className={styles.tableRowDesktop}>
                            {/* Transaction ID Column */}
                            <div
                                className={classNames(
                                    styles.tableCell,
                                    styles.tableCellFlex
                                )}
                            >
                                <p
                                    className={classNames(
                                        styles.cellText,
                                        styles.cellTextTruncate
                                    )}
                                >
                                    {tx.id}
                                </p>
                                <button
                                    onClick={() => handleCopyTxId(tx.id)}
                                    className={styles.copyButton}
                                    aria-label={`Copy transaction ID ${tx.id}`}
                                >
                                    <ExternalLink
                                        className={styles.copyIcon}
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>

                            {/* L2 Network Column */}
                            <div className={styles.tableCellFixed}>
                                <p className={styles.cellText}>
                                    {tx.sourceNetwork}
                                </p>
                            </div>

                            {/* Status Column */}
                            <div
                                className={classNames(
                                    styles.tableCell,
                                    styles.tableCellFlex
                                )}
                            >
                                {tx.statusLabel && (
                                    <p className={styles.statusLabel}>
                                        {tx.statusLabel}
                                    </p>
                                )}
                                <p className={styles.cellTextSecondary}>
                                    {tx.pendingTime}
                                </p>
                            </div>

                            {/* Status/Action Column */}
                            <div
                                className={classNames(
                                    styles.tableCell,
                                    styles.tableCellFixed,
                                    styles.tableCellRight
                                )}
                            >
                                {submittingTxIds.has(tx.id) ? (
                                    <div className={styles.submittingStatus}>
                                        <Loader2 className={styles.spinner} />
                                        <span className={styles.cellText}>
                                            {tx.actionType === 'prove' ? 'Proving...' : tx.actionType === 'finalize' ? 'Finalizing...' : 'Checking...'}
                                        </span>
                                    </div>
                                ) : tx.canClaim ? (
                                    <button
                                        className={styles.claimButton}
                                        onClick={() => onClaimTransaction(tx.id)}
                                        aria-label={`${tx.actionType === 'prove' ? 'Prove' : tx.actionType === 'finalize' ? 'Finalize' : 'Prove'} transaction ${tx.id}`}
                                    >
                                        {tx.actionType === 'prove' || tx.actionType === 'check' ? 'Prove' : 'Finalize'}
                                    </button>
                                ) : (
                                    <span
                                        className={styles.statusPending}
                                        role="status"
                                    >
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Mobile Layout - Stacked */}
                        <div className={styles.tableRowMobile}>
                            {/* Transaction ID */}
                            <div className={styles.mobileCellContainer}>
                                <p className={styles.cellLabel}>
                                    Transaction ID
                                </p>
                                <div className={styles.tableCell}>
                                    <p
                                        className={classNames(
                                            styles.cellText,
                                            styles.cellTextTruncate
                                        )}
                                    >
                                        {tx.id}
                                    </p>
                                    <button
                                        onClick={() => handleCopyTxId(tx.id)}
                                        className={styles.copyButton}
                                        aria-label={`Copy transaction ID ${tx.id}`}
                                    >
                                        <ExternalLink
                                            className={styles.copyIcon}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* L2 Network */}
                            <div className={styles.mobileCellContainer}>
                                <p className={styles.cellLabel}>L2</p>
                                <p className={styles.cellText}>
                                    {tx.sourceNetwork}
                                </p>
                            </div>

                            {/* Status */}
                            <div className={styles.mobileCellContainer}>
                                <p className={styles.cellLabel}>Status</p>
                                {tx.statusLabel && (
                                    <p className={styles.statusLabel}>
                                        {tx.statusLabel}
                                    </p>
                                )}
                                <p className={styles.cellTextSecondary}>
                                    {tx.pendingTime}
                                </p>
                            </div>

                            {/* Action */}
                            <div className={styles.tableCell}>
                                {submittingTxIds.has(tx.id) ? (
                                    <div className={styles.submittingStatus}>
                                        <Loader2 className={styles.spinner} />
                                        <span className={styles.cellText}>
                                            {tx.actionType === 'prove' ? 'Proving...' : tx.actionType === 'finalize' ? 'Finalizing...' : 'Checking...'}
                                        </span>
                                    </div>
                                ) : tx.canClaim ? (
                                    <button
                                        className={styles.claimButton}
                                        onClick={() => onClaimTransaction(tx.id)}
                                        aria-label={`${tx.actionType === 'prove' ? 'Prove' : tx.actionType === 'finalize' ? 'Finalize' : 'Prove'} transaction ${tx.id}`}
                                    >
                                        {tx.actionType === 'prove' || tx.actionType === 'check' ? 'Prove' : 'Finalize'}
                                    </button>
                                ) : (
                                    <span
                                        className={styles.statusPending}
                                        role="status"
                                    >
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Pagination */}
                <PaginationControls />
            </div>
        </div>
    )
}
