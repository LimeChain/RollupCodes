import { useEffect, useRef } from 'react'
import classNames from 'classnames'
import { Button } from '../Button/Button'
import CloseIcon from '../../../public/images/close-icon.svg'
import styles from './styles.module.scss'

interface TransactionDetails {
    withdrawnAmount: string
    sourceNetwork: string
    recipientNetwork: string
    estimatedTime: string
    transactionId: string
}

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading: boolean
    txDetails: TransactionDetails
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    txDetails,
}: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isLoading) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            return () => document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, isLoading, onClose])

    // Focus trap and initial focus
    useEffect(() => {
        if (isOpen && modalRef.current) {
            // Focus the close button when modal opens
            closeButtonRef.current?.focus()

            // Trap focus within modal
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[
                focusableElements.length - 1
            ] as HTMLElement

            const handleTab = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault()
                        lastElement?.focus()
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault()
                        firstElement?.focus()
                    }
                }
            }

            document.addEventListener('keydown', handleTab)
            return () => document.removeEventListener('keydown', handleTab)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className={classNames(styles.overlay, {
                    [styles.overlayClickable]: !isLoading,
                })}
                onClick={!isLoading ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className={styles.modalWrapper}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <div
                    ref={modalRef}
                    className={classNames(styles.modal, styles.modalLarge)}
                >
                    {/* Header */}
                    <div
                        className={classNames(styles.header, styles.headerNoMargin)}
                    >
                        <h2 id="modal-title" className={styles.title}>
                            Confirm Transaction
                        </h2>

                        {/* Close Button */}
                        {!isLoading && (
                            <button
                                ref={closeButtonRef}
                                onClick={onClose}
                                className={styles.closeButton}
                                aria-label="Close confirmation modal"
                            >
                                <CloseIcon aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    {/* Transaction Details */}
                    <div id="modal-description" className={styles.txDetails}>
                        <div className={styles.txDetailRow}>
                            <span className={styles.txDetailLabel}>
                                Withdrawn Amount
                            </span>
                            <div className={styles.txDetailValueContainer}>
                                <span
                                    className={styles.txDetailValue}
                                    aria-label={`Amount: ${txDetails.withdrawnAmount}`}
                                >
                                    {txDetails.withdrawnAmount}
                                </span>
                            </div>
                        </div>

                        <div className={styles.txDetailRow}>
                            <span className={styles.txDetailLabel}>
                                Source Network (L2)
                            </span>
                            <span className={styles.txDetailValue}>
                                {txDetails.sourceNetwork}
                            </span>
                        </div>

                        <div className={styles.txDetailRow}>
                            <span className={styles.txDetailLabel}>
                                Recipient Network (L1)
                            </span>
                            <span className={styles.txDetailValue}>
                                {txDetails.recipientNetwork}
                            </span>
                        </div>

                        <div className={styles.txDetailRow}>
                            <span className={styles.txDetailLabel}>
                                Estimated Time to Completion
                            </span>
                            <span className={styles.txDetailValue}>
                                {txDetails.estimatedTime}
                            </span>
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <Button
                        variant="secondary"
                        className={classNames(styles.confirmButton, {
                            [styles.buttonLoading]: isLoading,
                        })}
                        onClick={onConfirm}
                        disabled={isLoading}
                        aria-label={
                            isLoading
                                ? 'Waiting for wallet confirmation'
                                : 'Confirm transaction'
                        }
                    >
                        {isLoading ? (
                            <div className={styles.confirmButtonContent}>
                                <div
                                    className={styles.spinner}
                                    aria-hidden="true"
                                />
                                <span>Confirm in Wallet...</span>
                            </div>
                        ) : (
                            'Confirm'
                        )}
                    </Button>
                </div>
            </div>
        </>
    )
}
