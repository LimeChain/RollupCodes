import { useState } from 'react'
import styles from './styles.module.scss'
import CloseIcon from '../../../public/images/close-icon.svg'

interface WalletModalProps {
    isOpen: boolean
    onClose: () => void
    onConnect: (walletType: 'metamask' | 'walletconnect') => void
}

const WalletModal = ({ isOpen, onClose, onConnect }: WalletModalProps) => {
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    if (!isOpen) {
        return null
    }

    const handleConnect = (walletType: 'metamask' | 'walletconnect') => {
        if (!agreedToTerms) {
            return
        }
        onConnect(walletType)
    }

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Connect Wallet</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        type="button"
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.description}>
                        Connect your wallet below to begin. Always keep your private keys or seed phrase safe and secure
                    </p>

                    <div className={styles.walletOptions}>
                        <div className={styles.availableLabel}>Available</div>

                        <button
                            className={`${styles.walletOption} ${!agreedToTerms ? styles.disabled : ''}`}
                            onClick={() => handleConnect('metamask')}
                            disabled={!agreedToTerms}
                            type="button"
                        >
                            <div className={styles.walletIcon}>
                                <img src="/images/metamask.svg" alt="MetaMask" width="24" height="24" />
                            </div>
                            <span className={styles.walletName}>Metamask</span>
                        </button>

                        <button
                            className={`${styles.walletOption} ${!agreedToTerms ? styles.disabled : ''}`}
                            onClick={() => handleConnect('walletconnect')}
                            disabled={!agreedToTerms}
                            type="button"
                        >
                    <div className={styles.walletIcon}>
                                <img src="/images/walletconnect.png" alt="WalletConnect" width="24" height="24" />
                            </div>
                            <span className={styles.walletName}>WalletConnect</span>
                        </button>
                    </div>

                    <label className={styles.termsCheckbox}>
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>
                            By connecting a wallet, you agree to our{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer">
                                Terms of Service
                            </a>{' '}
                            and consent to its{' '}
                            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                                Privacy Policy
                            </a>
                        </span>
                    </label>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.connectButton}
                        onClick={() => handleConnect('metamask')}
                        disabled={!agreedToTerms}
                        type="button"
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WalletModal
