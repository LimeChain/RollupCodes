import classNames from 'classnames'
import MetamaskIcon from '../../../public/images/WalletIcon-Metamask.svg'
import WalletConnectIcon from '../../../public/images/WalletIcon-WalletConnect.svg'
import styles from './styles.module.scss'

interface ConnectingWalletModalProps {
    isOpen: boolean
    walletName: string
}

export function ConnectingWalletModal({
    isOpen,
    walletName,
}: ConnectingWalletModalProps) {
    if (!isOpen) return null

    const walletDisplayName =
        walletName === 'metamask' ? 'Metamask' : 'WalletConnect'
    const WalletIcon =
        walletName === 'metamask' ? MetamaskIcon : WalletConnectIcon

    return (
        <>
            {/* Overlay */}
            <div className={styles.overlay} aria-hidden="true" />

            {/* Modal */}
            <div
                className={classNames(
                    styles.modalWrapper,
                    styles.modalWrapperTop
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="connecting-modal-title"
                aria-describedby="connecting-modal-description"
                aria-live="polite"
                aria-busy="true"
            >
                <div
                    className={classNames(styles.modal, styles.connectingContent)}
                >
                    {/* Pulsing Circle with Wallet Icon */}
                    <div className={styles.pulsingContainer} aria-hidden="true">
                        {/* Pulsing circles */}
                        <div className={styles.pulsingCirclesContainer}>
                            <div className={styles.pulsingCircleOuter} />
                            <div className={styles.pulsingCircleInner} />
                        </div>

                        {/* Accent circle */}
                        <div className={styles.accentCircle}>
                            {/* Wallet Icon */}
                            <WalletIcon />
                        </div>
                    </div>

                    {/* Text */}
                    <div className={styles.connectingText}>
                        <h3
                            id="connecting-modal-title"
                            className={styles.connectingTitle}
                        >
                            Connecting to {walletDisplayName}
                        </h3>
                        <p
                            id="connecting-modal-description"
                            className={styles.connectingDescription}
                        >
                            Please confirm the connection in your wallet
                            extension
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
