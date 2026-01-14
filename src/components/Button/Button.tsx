import classNames from 'classnames'
import styles from './styles.module.scss'

interface ButtonProps {
    variant?: 'primary' | 'secondary'
    size?: 'L' | 'XL' | 'M'
    children?: React.ReactNode
    className?: string
    onClick?: () => void
    style?: React.CSSProperties
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    'aria-label'?: string
}

export function Button({
    variant = 'primary',
    size = 'L',
    children = 'Button',
    className,
    onClick,
    style,
    type = 'button',
    disabled = false,
    'aria-label': ariaLabel,
}: ButtonProps) {
    const isXL = size === 'XL'
    const isM = size === 'M'
    const isPrimary = variant === 'primary'

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={classNames(
                styles.button,
                {
                    [styles.sizeXL]: isXL,
                    [styles.sizeL]: !isXL && !isM,
                    [styles.sizeM]: isM,
                    [styles.primary]: isPrimary && !isXL,
                    [styles.primaryXL]: isPrimary && isXL,
                    [styles.secondary]: !isPrimary,
                },
                className
            )}
            style={style}
        >
            {children}
        </button>
    )
}
