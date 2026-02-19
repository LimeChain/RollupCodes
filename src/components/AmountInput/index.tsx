import { ChangeEvent } from 'react'
import styles from './styles.module.scss'

interface AmountInputProps {
    value: string
    onChange: (value: string) => void
    balance: string
    symbol: string
    disabled?: boolean
    onMaxClick: () => void
    error?: string
}

const AmountInput = ({
    value,
    onChange,
    balance,
    symbol,
    disabled = false,
    onMaxClick,
    error
}: AmountInputProps) => {
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value

        // Allow empty string
        if (inputValue === '') {
            onChange('')
            return
        }

        // Allow only numbers and one decimal point
        const regex = /^\d*\.?\d*$/
        if (regex.test(inputValue)) {
            onChange(inputValue)
        }
    }

    return (
        <div className={styles.amountInput}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={`${styles.input} ${error ? styles.error : ''}`}
                    value={value}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={disabled}
                />
                <div className={styles.controls}>
                    <span className={styles.symbol}>{symbol}</span>
                    <button
                        type="button"
                        className={styles.maxButton}
                        onClick={onMaxClick}
                        disabled={disabled || !balance || balance === '0'}
                    >
                        MAX
                    </button>
                </div>
            </div>
            <div className={styles.balanceRow}>
                <span className={styles.balanceLabel}>Balance:</span>
                <span className={styles.balanceValue}>
                    {balance} {symbol}
                </span>
            </div>
            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    )
}

export default AmountInput
