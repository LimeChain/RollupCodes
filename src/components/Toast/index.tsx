import { useEffect } from 'react'
import classNames from 'classnames'
import styles from './styles.module.scss'
import CloseIcon from '../../../public/images/close-icon.svg'
import CheckmarkIcon from '../../../public/images/checkmark-icon.svg'

export interface ToastProps {
    isOpen: boolean
    message: string
    description?: string
    type?: 'success' | 'error' | 'info'
    duration?: number
    onClose: () => void
    actionLabel?: string
    onAction?: () => void
}

// Props for container-managed toasts (without isOpen, with id)
export interface ContainerToastProps {
    id: string
    message: string
    description?: string
    type?: 'success' | 'error' | 'info'
    duration?: number
    onClose: (id: string) => void
    actionLabel?: string
    onAction?: () => void
}

// Standalone Toast component with isOpen prop
export function Toast({
    isOpen,
    message,
    description,
    type = 'success',
    duration = 5000,
    onClose,
    actionLabel,
    onAction,
}: ToastProps) {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [isOpen, duration, onClose])

    if (!isOpen) return null

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckmarkIcon className={styles.icon} />
            case 'error':
                return <span className={styles.iconText}>✕</span>
            case 'info':
                return <span className={styles.iconText}>ⓘ</span>
            default:
                return null
        }
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={classNames(styles.toast, styles[type])}
        >
            <div className={styles.iconWrapper}>{getIcon()}</div>
            <div className={styles.content}>
                <p className={styles.message}>{message}</p>
                {description && (
                    <p className={styles.description}>{description}</p>
                )}
            </div>
            <button
                className={styles.closeButton}
                onClick={onClose}
                type="button"
                aria-label="Close notification"
            >
                <CloseIcon />
            </button>
            {actionLabel && onAction && (
                <button
                    className={styles.actionButton}
                    onClick={onAction}
                    type="button"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

// Container-managed Toast component with id prop
export function ContainerToast({
    id,
    message,
    description,
    type = 'success',
    duration = 5000,
    onClose,
    actionLabel,
    onAction,
}: ContainerToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id)
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [id, duration, onClose])

    const handleClose = () => {
        onClose(id)
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckmarkIcon className={styles.icon} />
            case 'error':
                return <span className={styles.iconText}>✕</span>
            case 'info':
                return <span className={styles.iconText}>ⓘ</span>
            default:
                return null
        }
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={classNames(styles.toastInContainer, styles[type])}
        >
            <div className={styles.iconWrapper}>{getIcon()}</div>
            <div className={styles.content}>
                <p className={styles.message}>{message}</p>
                {description && (
                    <p className={styles.description}>{description}</p>
                )}
            </div>
            <button
                className={styles.closeButton}
                onClick={handleClose}
                type="button"
                aria-label="Close notification"
            >
                <CloseIcon />
            </button>
            {actionLabel && onAction && (
                <button
                    className={styles.actionButton}
                    onClick={onAction}
                    type="button"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

export default Toast
