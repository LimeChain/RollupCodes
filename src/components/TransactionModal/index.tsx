import styles from './styles.module.scss'
import CloseIcon from '../../../public/images/close-icon.svg'

interface TransactionModalProps {
    isOpen: boolean
    onClose: () => void
    amount: string
    symbol: string
    sourceNetwork: string
    recipientNetwork: string
    estimatedTime: string
    onConfirm: () => void
    isConfirming?: boolean
}

const TransactionModal = ({
    isOpen,
    onClose,
    amount,
    symbol,
    sourceNetwork,
    recipientNetwork,
    estimatedTime,
    onConfirm,
    isConfirming = false
}: TransactionModalProps) => {
    if (!isOpen) {
        return null
    }

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isConfirming) {
            onClose()
        }
    }

    return (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Transaction Details</h2>
                    {!isConfirming && (
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            type="button"
                            aria-label="Close modal"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Withdrawal Amount</span>
                        <span className={styles.detailValue}>
                            {amount} {symbol}
                            <span className={styles.detailValueSecondary}>$0.00</span>
                        </span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Source Network (L2)</span>
                        <span className={styles.detailValue}>{sourceNetwork}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Recipient Network (L1)</span>
                        <span className={styles.detailValue}>{recipientNetwork}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Estimated Time to Completion</span>
                        <span className={styles.detailValue}>
                            {estimatedTime}
                            <span className={styles.infoIcon} title="Time required for the complete withdrawal process including challenge period">
                                ⓘ
                            </span>
                        </span>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    {isConfirming ? (
                        <button
                            className={`${styles.actionButton} ${styles.confirming}`}
                            disabled
                            type="button"
                        >
                            <span className={styles.spinner}></span>
                            Confirming Transaction
                        </button>
                    ) : (
                        <>
                            <button
                                className={`${styles.actionButton} ${styles.secondary}`}
                                onClick={onClose}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.actionButton} ${styles.primary}`}
                                onClick={onConfirm}
                                type="button"
                            >
                                Confirm Transaction
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TransactionModal
