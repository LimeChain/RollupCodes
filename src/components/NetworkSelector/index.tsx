import { useState, useRef, useEffect } from 'react'
import styles from './styles.module.scss'
import { ExitHatchSpec } from '@utils/types'
import ChevronDownIcon from '../../../public/images/chevron-down-icon.svg'

interface NetworkSelectorProps {
    networks: ExitHatchSpec[]
    selectedNetwork: string
    onNetworkChange: (network: string) => void
    disabled?: boolean
}

const NetworkSelector = ({ networks, selectedNetwork, onNetworkChange, disabled = false }: NetworkSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedNetworkData = networks.find(n => n.network === selectedNetwork)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSelect = (network: string) => {
        onNetworkChange(network)
        setIsOpen(false)
    }

    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen)
        }
    }

    if (!selectedNetworkData) {
        return null
    }

    return (
        <div className={styles.networkSelector} ref={dropdownRef}>
            <button
                className={`${styles.selectorButton} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
                onClick={toggleDropdown}
                disabled={disabled}
                type="button"
            >
                <div className={styles.selectedNetwork}>
                    <div className={styles.networkIcon}>
                        <img
                            src={`/images/${selectedNetworkData.network_display.icon}`}
                            alt={selectedNetworkData.network_display.name}
                            onError={(e) => {
                                // Fallback if image doesn't exist
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                            }}
                        />
                    </div>
                    <span className={styles.networkName}>
                        {selectedNetworkData.network_display.name}
                    </span>
                </div>
                <ChevronDownIcon className={styles.chevronIcon} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownList}>
                        {networks.map((network) => (
                            <button
                                key={network.network}
                                className={`${styles.dropdownItem} ${
                                    network.network === selectedNetwork ? styles.selected : ''
                                }`}
                                onClick={() => handleSelect(network.network)}
                                type="button"
                            >
                                <div className={styles.networkIcon}>
                                    <img
                                        src={`/images/${network.network_display.icon}`}
                                        alt={network.network_display.name}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                        }}
                                    />
                                </div>
                                <div className={styles.networkInfo}>
                                    <span className={styles.networkName}>
                                        {network.network_display.name}
                                    </span>
                                    <span className={styles.networkChainId}>
                                        Chain ID: {network.chain_id}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NetworkSelector
