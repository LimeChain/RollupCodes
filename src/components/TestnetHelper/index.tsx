import { ExitHatchSpec } from '@utils/types'
import { isTestnet } from '@utils/networkUtils'
import styles from './styles.module.scss'

interface TestnetHelperProps {
    currentNetwork: ExitHatchSpec
}

const TestnetHelper = ({ currentNetwork }: TestnetHelperProps) => {
    const chainId = currentNetwork.network_display.l2_chain_id

    // Only show for testnet
    if (!isTestnet(chainId)) {
        return null
    }

    const faucets = currentNetwork.documentation_urls?.filter(doc =>
        doc.label.toLowerCase().includes('faucet')
    ) || []

    return (
        <div className={styles.testnetHelper}>
            <div className={styles.banner}>
                <div className={styles.icon}>🧪</div>
                <div className={styles.content}>
                    <h3 className={styles.title}>Testnet Mode</h3>
                    <p className={styles.description}>
                        You're using {currentNetwork.network_display.name} testnet.
                        This is a safe testing environment with no real value.
                    </p>
                </div>
            </div>

            {faucets.length > 0 && (
                <div className={styles.faucetSection}>
                    <h4 className={styles.sectionTitle}>Get Test ETH</h4>
                    <p className={styles.sectionDescription}>
                        You'll need test ETH on both L1 (Sepolia) and L2 (Optimism Sepolia) to test withdrawals:
                    </p>
                    <div className={styles.faucetLinks}>
                        {faucets.map((faucet, index) => (
                            <a
                                key={index}
                                href={faucet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.faucetLink}
                            >
                                <span className={styles.faucetIcon}>💧</span>
                                <span className={styles.faucetLabel}>{faucet.label}</span>
                                <span className={styles.externalIcon}>→</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.testingGuide}>
                <h4 className={styles.sectionTitle}>Testing the Withdrawal Flow</h4>
                <ol className={styles.stepsList}>
                    <li className={styles.step}>
                        <strong>Get testnet ETH:</strong> Use the faucets above to get test ETH on both Sepolia and Optimism Sepolia
                    </li>
                    <li className={styles.step}>
                        <strong>Bridge to L2:</strong> If you only have Sepolia ETH, bridge some to Optimism Sepolia first using the{' '}
                        <a href="https://app.optimism.io/bridge" target="_blank" rel="noopener noreferrer">
                            official bridge
                        </a>
                    </li>
                    <li className={styles.step}>
                        <strong>Initiate withdrawal:</strong> Enter an amount (min 0.001 ETH) and click "Move Funds"
                    </li>
                    <li className={styles.step}>
                        <strong>Wait ~1 hour:</strong> L2 state needs to be proposed to L1 (automatic)
                    </li>
                    <li className={styles.step}>
                        <strong>Complete withdrawal:</strong> After state root is published (~1 hour), complete the remaining steps at the{' '}
                        <a href="https://app.optimism.io/bridge" target="_blank" rel="noopener noreferrer">
                            official Optimism bridge
                        </a>
                        {' '}(proof generation requires backend service)
                    </li>
                    <li className={styles.step}>
                        <strong>Alternative:</strong> Or click "Submit Proof" in the Pending tab if you have a proof service set up
                    </li>
                </ol>
            </div>

            <div className={styles.tipsSection}>
                <h4 className={styles.sectionTitle}>💡 Testing Tips</h4>
                <ul className={styles.tipsList}>
                    <li>Keep both browser tabs open (L1 and L2 block explorers) to track transactions</li>
                    <li>Save your withdrawal transaction hash - you'll need it for proof generation</li>
                    <li>The "Pending" tab auto-refreshes every 60 seconds to check status updates</li>
                    <li>Open browser console (F12) to see detailed logs during each step</li>
                    <li>Withdrawal data is stored in localStorage - clearing it will lose tracking info</li>
                </ul>
            </div>

            <div className={styles.troubleshooting}>
                <h4 className={styles.sectionTitle}>🔧 Troubleshooting</h4>
                <div className={styles.troubleshootingGrid}>
                    <div className={styles.troubleItem}>
                        <strong>"Failed to connect to MetaMask"</strong>
                        <p>Make sure MetaMask is installed and unlocked</p>
                    </div>
                    <div className={styles.troubleItem}>
                        <strong>"Wrong network" error</strong>
                        <p>Click the network switcher - the app will prompt MetaMask to switch</p>
                    </div>
                    <div className={styles.troubleItem}>
                        <strong>"State root not published"</strong>
                        <p>Wait at least 1 hour after initiating withdrawal before proving</p>
                    </div>
                    <div className={styles.troubleItem}>
                        <strong>"Proof generation failed"</strong>
                        <p>Check browser console for details. May need to wait longer or transaction might not be a withdrawal</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestnetHelper
