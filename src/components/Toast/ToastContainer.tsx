import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ContainerToast, ContainerToastProps } from './index'
import styles from './ToastContainer.module.scss'

interface ToastContextType {
    addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

interface ToastProviderProps {
    children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<Omit<ContainerToastProps, 'onClose'>[]>([])

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map(toast => (
                    <ContainerToast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}
