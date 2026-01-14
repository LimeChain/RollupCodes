import { useEffect, useState } from 'react'
import styles from './styles.module.scss'

const BackendStatus = () => {
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        checkBackendStatus()
        // Check every 30 seconds
        const interval = setInterval(checkBackendStatus, 30000)
        return () => clearInterval(interval)
    }, [])

    const checkBackendStatus = async () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)

            const response = await fetch(`${backendUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (response.ok) {
                setBackendStatus('online')
            } else {
                setBackendStatus('offline')
            }
        } catch (error) {
            setBackendStatus('offline')
        }
    }

    if (backendStatus === 'checking') {
        return null
    }

    if (backendStatus === 'online') {
        return (
            <div className={styles.backendStatus} data-status="online">
                <span className={styles.indicator}>●</span>
                <span>Backend Online - Full functionality enabled</span>
            </div>
        )
    }

    const isDev = process.env.NODE_ENV !== 'production'

    return (
        <div className={styles.backendStatus} data-status="offline">
            <div className={styles.header}>
                <span className={styles.indicator}>●</span>
                <span>Backend Offline - Proof generation unavailable</span>
                <button
                    className={styles.detailsButton}
                    onClick={() => setShowDetails(!showDetails)}
                    type="button"
                >
                    {showDetails ? '−' : '+'}
                </button>
            </div>

            {showDetails && (
                <div className={styles.details}>
                    <p className={styles.description}>
                        The backend service is required for Steps 3-5 (proof generation and finalization).
                        {isDev ? (
                            <>
                                {' '}You can still initiate withdrawals (Step 1), but will need to complete them via the{' '}
                                <a href="https://app.optimism.io/bridge" target="_blank" rel="noopener noreferrer">
                                    official Optimism bridge
                                </a>.
                            </>
                        ) : (
                            ' Please contact support for assistance.'
                        )}
                    </p>

                    {isDev && (
                        <div className={styles.instructions}>
                            <strong>To enable full functionality:</strong>
                            <ol>
                                <li>Open a new terminal</li>
                                <li>
                                    <code>cd server</code>
                                </li>
                                <li>
                                    <code>npm install</code>
                                </li>
                                <li>
                                    <code>npm run dev</code>
                                </li>
                            </ol>
                            <p className={styles.note}>
                                See <code>BACKEND_SETUP.md</code> for complete guide
                            </p>
                        </div>
                    )}

                    <button
                        className={styles.retryButton}
                        onClick={checkBackendStatus}
                        type="button"
                    >
                        Check Again
                    </button>
                </div>
            )}
        </div>
    )
}

export default BackendStatus
