import { useEffect, useRef } from 'react'
import classNames from 'classnames'
import MetamaskIcon from '../../../public/images/WalletIcon-Metamask.svg'
import WalletConnectIcon from '../../../public/images/WalletIcon-WalletConnect.svg'
import CloseIcon from '../../../public/images/close-icon.svg'
import styles from './styles.module.scss'

interface WalletOption {
    id: string
    name: string
    Icon: React.FC<React.SVGProps<SVGSVGElement>>
}

interface WalletConnectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConnect: (walletId: string) => void
}

const WALLET_OPTIONS: WalletOption[] = [
    {
        id: 'metamask',
        name: 'Metamask',
        Icon: MetamaskIcon,
    },
    {
        id: 'walletconnect',
        name: 'WalletConnect',
        Icon: WalletConnectIcon,
    },
]

export function WalletConnectionModal({
    isOpen,
    onClose,
    onConnect,
}: WalletConnectionModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            return () => document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

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
                className={classNames(styles.overlay, styles.overlayClickable)}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className={styles.modalWrapper}
                role="dialog"
                aria-modal="true"
                aria-labelledby="wallet-modal-title"
                aria-describedby="wallet-modal-description"
            >
                <div ref={modalRef} className={styles.modal}>
                    {/* Header with Close Button */}
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <h2
                                id="wallet-modal-title"
                                className={styles.title}
                            >
                                Connect Wallet
                            </h2>
                            <p
                                id="wallet-modal-description"
                                className={styles.description}
                            >
                                Connect your wallet below to begin
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className={styles.closeButton}
                            aria-label="Close wallet connection modal"
                        >
                            <CloseIcon aria-hidden="true" />
                        </button>
                    </div>

                    {/* Wallet Options */}
                    <div
                        className={styles.walletList}
                        role="list"
                        aria-label="Available wallets"
                    >
                        <span className={styles.walletListLabel}>Available</span>

                        {WALLET_OPTIONS.map((wallet) => (
                            <button
                                key={wallet.id}
                                role="listitem"
                                onClick={() => {
                                    onConnect(wallet.id)
                                }}
                                className={styles.walletOption}
                                aria-label={`Connect with ${wallet.name}`}
                            >
                                <wallet.Icon aria-hidden="true" />
                                <span className={styles.walletOptionName}>
                                    {wallet.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
