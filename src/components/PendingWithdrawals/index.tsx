import { useState, useEffect } from 'react'
import { StoredWithdrawal } from '../../types/withdrawal'
import { ExitHatchSpec } from '@utils/types'
import { useWithdrawals } from '@hooks/useWithdrawal'
import { getWithdrawalSteps, getWithdrawalStatusText } from '@hooks/useWithdrawal'
import WithdrawalStepper from '@components/WithdrawalStepper'
import { useToast } from '@components/Toast/ToastContainer'
import { executeProveWithdrawal, executeFinalizeWithdrawal, checkAndUpdateWithdrawalStatus } from '@services/withdrawalFlowService'
import styles from './styles.module.scss'

interface PendingWithdrawalsProps {
    walletAddress: string
    currentNetwork: ExitHatchSpec
}

const PendingWithdrawals = ({ walletAddress, currentNetwork }: PendingWithdrawalsProps) => {
    const { pendingWithdrawals, loading, refresh } = useWithdrawals(walletAddress)
    const [expandedWithdrawal, setExpandedWithdrawal] = useState<string | null>(null)
    const [executingStep, setExecutingStep] = useState<string | null>(null)
    const { addToast } = useToast()

    // Filter withdrawals for current network
    const networkWithdrawals = pendingWithdrawals.filter(
        w => w.sourceNetwork === currentNetwork.network
    )

    const toggleExpand = (withdrawalId: string) => {
        setExpandedWithdrawal(expandedWithdrawal === withdrawalId ? null : withdrawalId)
    }

    // Auto-refresh withdrawal statuses periodically
    useEffect(() => {
        if (networkWithdrawals.length === 0) return

        const checkAllWithdrawals = async () => {
            let hasUpdates = false

            for (const withdrawal of networkWithdrawals) {
                // Only check withdrawals that are waiting for something
                if (['initiated', 'waiting_state_root', 'proven', 'waiting_challenge'].includes(withdrawal.status)) {
                    const updated = await checkAndUpdateWithdrawalStatus(withdrawal)
                    if (updated.status !== withdrawal.status) {
                        hasUpdates = true
                    }
                }
            }

            if (hasUpdates) {
                refresh()
            }
        }

        // Check immediately
        checkAllWithdrawals()

        // Then check every minute
        const intervalId = setInterval(checkAllWithdrawals, 60000)

        return () => clearInterval(intervalId)
    }, [networkWithdrawals.length, refresh])

    const handleExecuteStep = async (stepId: string, withdrawal: StoredWithdrawal) => {
        setExecutingStep(`${withdrawal.id}-${stepId}`)

        try {
            if (stepId === 'prove') {
                addToast('Proving withdrawal...', 'info')
                const result = await executeProveWithdrawal(withdrawal)

                if (result.success) {
                    addToast('Proof submitted successfully!', 'success')
                    refresh()
                } else {
                    addToast(result.error || 'Failed to prove withdrawal', 'error')
                }
            } else if (stepId === 'finalize') {
                addToast('Finalizing withdrawal...', 'info')
                const result = await executeFinalizeWithdrawal(withdrawal)

                if (result.success) {
                    addToast('Withdrawal finalized! Funds received on L1.', 'success')
                    refresh()
                } else {
                    addToast(result.error || 'Failed to finalize withdrawal', 'error')
                }
            }
        } catch (error: any) {
            addToast(error.message || 'Failed to execute step', 'error')
        } finally {
            setExecutingStep(null)
        }
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                Loading pending withdrawals...
            </div>
        )
    }

    if (networkWithdrawals.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h3 className={styles.emptyTitle}>No Pending Withdrawals</h3>
                <p className={styles.emptyDescription}>
                    You don't have any pending withdrawals on {currentNetwork.network_display.name}.
                    <br />
                    Start a new withdrawal to see it here.
                </p>
            </div>
        )
    }

    return (
        <div className={styles.pendingWithdrawals}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>
                        Pending Withdrawals ({networkWithdrawals.length})
                    </h3>
                    <p className={styles.subtitle}>
                        Track your active withdrawals and complete the required steps
                    </p>
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={async () => {
                        addToast('Checking withdrawal statuses...', 'info')
                        let hasUpdates = false

                        for (const withdrawal of networkWithdrawals) {
                            if (['initiated', 'waiting_state_root', 'proven', 'waiting_challenge'].includes(withdrawal.status)) {
                                const updated = await checkAndUpdateWithdrawalStatus(withdrawal)
                                if (updated.status !== withdrawal.status) {
                                    hasUpdates = true
                                }
                            }
                        }

                        // Always refresh to reload from localStorage
                        refresh()

                        if (hasUpdates) {
                            addToast('Status updated!', 'success')
                        } else {
                            addToast('No status changes', 'info')
                        }
                    }}
                    type="button"
                >
                    Refresh Status
                </button>
            </div>

            <div className={styles.withdrawalsList}>
                {networkWithdrawals.map((withdrawal) => {
                    const isExpanded = expandedWithdrawal === withdrawal.id
                    const steps = getWithdrawalSteps(withdrawal, currentNetwork)
                    const currentStep = steps.find(s => s.status === 'in_progress') || steps.find(s => s.canExecute)

                    return (
                        <div key={withdrawal.id} className={styles.withdrawalCard}>
                            <div
                                className={styles.withdrawalHeader}
                                onClick={() => toggleExpand(withdrawal.id)}
                            >
                                <div className={styles.withdrawalInfo}>
                                    <div className={styles.amount}>
                                        {withdrawal.amount} {currentNetwork.supported_asset.symbol}
                                    </div>
                                    <div className={styles.status}>
                                        {getWithdrawalStatusText(withdrawal)}
                                    </div>
                                    <div className={styles.timestamp}>
                                        Initiated {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                                <button className={styles.expandButton} type="button">
                                    {isExpanded ? '−' : '+'}
                                </button>
                            </div>

                            {isExpanded && (
                                <div className={styles.withdrawalDetails}>
                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>From:</span>
                                            <span className={styles.detailValue}>
                                                fromAddress
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>To:</span>
                                            <span className={styles.detailValue}>
                                                {withdrawal.toAddress.substring(0, 10)}...{withdrawal.toAddress.substring(34)}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>L2 Tx:</span>
                                            <a
                                                href={`${currentNetwork.network_display.explorer_url}/tx/${withdrawal.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.detailLink}
                                            >
                                                View on Explorer →
                                            </a>
                                        </div>
                                    </div>

                                    <div className={styles.stepsSection}>
                                        <h4 className={styles.stepsTitle}>Withdrawal Progress</h4>
                                        <WithdrawalStepper
                                            steps={steps}
                                            onExecuteStep={(stepId) => handleExecuteStep(stepId, withdrawal)}
                                            isExecuting={executingStep === `${withdrawal.id}-prove` || executingStep === `${withdrawal.id}-finalize`}
                                        />
                                    </div>

                                    {currentStep?.canExecute && (
                                        <div className={styles.actionPrompt}>
                                            <strong>Action Required:</strong> {currentStep.name} is ready to execute
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default PendingWithdrawals
