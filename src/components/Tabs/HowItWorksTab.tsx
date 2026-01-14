import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import classNames from 'classnames'
import { getNetworkDisplayOptions } from '@data/networks'
import styles from './styles.module.scss'

interface HowItWorksTabProps {
    isConnected: boolean
}

export function HowItWorksTab({ isConnected }: HowItWorksTabProps) {
    // Get network display options from shared config (mainnet only for documentation)
    const networks = useMemo(() => getNetworkDisplayOptions(false), [])
    const [selectedNetwork, setSelectedNetwork] = useState(networks[1]) // Base by default
    const [isNetworkOpen, setIsNetworkOpen] = useState(false)
    const [isNetworkHovered, setIsNetworkHovered] = useState(false)
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
    const networkRef = useRef<HTMLDivElement>(null)

    const steps = [
        {
            id: 1,
            title: 'Initiate Withdrawal',
            description:
                'To initiate the withdrawal, the user submits a transaction on the Layer 2 (L2) network by clicking "Initiate Withdrawal" and signing the request in their wallet. This action calls the Withdraw method on the L2StandardBridge contract (address 0x4200...0010) and typically requires about 70,000 L2 gas and roughly two minutes to confirm. During this period, the interface updates with status messages to indicate whether the transaction is pending ("Waiting for transaction confirmation..."), successfully initiated, or if it failed and needs to be retried.',
        },
        {
            id: 2,
            title: 'Wait for State Root Proposal',
            description:
                'After initiation, the process enters an automatic waiting phase where the Layer 2 state is proposed to Layer 1. This step requires no user action and takes approximately one hour to complete, during which the status transitions from "Waiting for state root proposal" to "State root proposed".',
        },
        {
            id: 3,
            title: 'Prove Withdrawal',
            description:
                'Once the state root is proposed, the user must actively click "Prove Withdrawal" and sign a transaction on Layer 1 to submit a merkle proof. This interaction targets the OptimismPortal contract (address 0x0Ec6...Db6Cb) using the proveWithdrawalTransaction method, typically costing around 250,000 L1 gas and taking about five minutes to confirm.',
        },
        {
            id: 4,
            title: 'Challenge Period',
            description:
                'Following the proof submission, the withdrawal enters a mandatory 7-day security window known as the Challenge Period on Layer 1. This acts as a passive waiting period where no user action is required; the interface simply tracks the remaining time until the status updates to "Challenge period completed".',
        },
        {
            id: 5,
            title: 'Finalize Withdrawal',
            description:
                'To conclude the process and receive funds on Layer 1, the user must click "Finalize Withdrawal" and sign a final transaction. This calls the finalizeWithdrawalTransaction method on the OptimismPortal contract, which takes approximately three minutes and costs roughly 220,000 L1 gas to complete the transfer.',
        },
    ]

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                networkRef.current &&
                !networkRef.current.contains(event.target as Node)
            ) {
                setIsNetworkOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                {/* From L2 Network Selector */}
                <div ref={networkRef} className={styles.networkSelector}>
                    <label
                        htmlFor="how-it-works-network"
                        className={styles.networkLabel}
                    >
                        From
                    </label>
                    <button
                        id="how-it-works-network"
                        onClick={() => setIsNetworkOpen(!isNetworkOpen)}
                        onMouseEnter={() => setIsNetworkHovered(true)}
                        onMouseLeave={() => setIsNetworkHovered(false)}
                        className={classNames(styles.networkButton, {
                            [styles.open]: isNetworkOpen,
                        })}
                        aria-label={`Select network, currently ${selectedNetwork.name}`}
                        aria-expanded={isNetworkOpen}
                        aria-haspopup="listbox"
                    >
                        <div className={styles.networkButtonContent}>
                            <img
                                src={selectedNetwork.icon}
                                alt={selectedNetwork.name}
                                className={styles.networkIcon}
                            />
                            <span className={styles.networkName}>
                                {selectedNetwork.name}
                            </span>
                        </div>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className={classNames(styles.chevron, {
                                [styles.chevronRotated]: isNetworkOpen,
                            })}
                        >
                            <path
                                d="M4 6L8 10L12 6"
                                className={classNames(styles.chevronPath, {
                                    [styles.chevronPathActive]:
                                        isNetworkHovered || isNetworkOpen,
                                })}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {/* Network Dropdown */}
                    {isNetworkOpen && (
                        <div
                            role="listbox"
                            aria-label="Select network"
                            className={styles.networkDropdown}
                        >
                            {networks.map((network) => (
                                <button
                                    key={network.name}
                                    role="option"
                                    aria-selected={
                                        selectedNetwork.name === network.name
                                    }
                                    onClick={() => {
                                        setSelectedNetwork(network)
                                        setIsNetworkOpen(false)
                                    }}
                                    className={classNames(styles.networkOption, {
                                        [styles.selected]:
                                            selectedNetwork.name ===
                                            network.name,
                                    })}
                                >
                                    <img
                                        src={network.icon}
                                        alt={network.name}
                                        className={styles.networkIcon}
                                        aria-hidden="true"
                                    />
                                    <span className={styles.networkName}>
                                        {network.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Learn More Links */}
                <nav
                    aria-label="Additional resources"
                    className={styles.linksNav}
                >
                    <a
                        href="#"
                        className={styles.externalLink}
                        aria-label="Withdrawal Guide (opens in new window)"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Withdrawal Guide
                        <ExternalLink
                            className={styles.externalLinkIcon}
                            aria-hidden="true"
                        />
                    </a>
                    <a
                        href="#"
                        className={styles.externalLink}
                        aria-label="L2 Documentation (opens in new window)"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        L2 Documentation
                        <ExternalLink
                            className={styles.externalLinkIcon}
                            aria-hidden="true"
                        />
                    </a>
                </nav>
            </div>

            {/* Steps Section */}
            <div className={styles.stepsContainer}>
                {steps.map((step) => {
                    const isExpanded = expandedSteps.has(step.id)
                    const [isHovered, setIsHovered] = useState(false)

                    return (
                        <div
                            key={step.id}
                            className={styles.stepItem}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <button
                                onClick={() => {
                                    const newExpanded = new Set(expandedSteps)
                                    if (newExpanded.has(step.id)) {
                                        newExpanded.delete(step.id)
                                    } else {
                                        newExpanded.add(step.id)
                                    }
                                    setExpandedSteps(newExpanded)
                                }}
                                className={styles.stepButton}
                                aria-expanded={isExpanded}
                                aria-label={`${step.title}, step ${step.id} of ${steps.length}`}
                                aria-controls={`step-${step.id}-content`}
                            >
                                {/* Step Number */}
                                <div className={styles.stepNumber}>
                                    <span className={styles.stepNumberText}>
                                        {step.id}
                                    </span>
                                </div>

                                {/* Step Content */}
                                <div className={styles.stepContent}>
                                    <p
                                        id={`step-${step.id}-title`}
                                        className={styles.stepTitle}
                                    >
                                        {step.title}
                                    </p>

                                    <div
                                        id={`step-${step.id}-content`}
                                        role="region"
                                        aria-labelledby={`step-${step.id}-title`}
                                        className={styles.stepDescription}
                                        style={{
                                            maxHeight: isExpanded
                                                ? '500px'
                                                : '0',
                                            opacity: isExpanded ? 1 : 0,
                                        }}
                                    >
                                        <p className={styles.stepDescriptionText}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Chevron Icon */}
                                <div className={styles.stepChevron}>
                                    {isExpanded ? (
                                        <ChevronUp
                                            className={classNames(
                                                styles.stepChevronIcon,
                                                {
                                                    [styles.stepChevronIconActive]:
                                                        isHovered,
                                                }
                                            )}
                                        />
                                    ) : (
                                        <ChevronDown
                                            className={classNames(
                                                styles.stepChevronIcon,
                                                {
                                                    [styles.stepChevronIconActive]:
                                                        isHovered,
                                                }
                                            )}
                                        />
                                    )}
                                </div>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
