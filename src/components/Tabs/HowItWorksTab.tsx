import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import classNames from 'classnames'
import { getNetworkDisplayOptions, WithdrawalStep } from '@data/networks'
import styles from './styles.module.scss'

/**
 * Generate a detailed description for a withdrawal step based on its data
 */
function generateStepDescription(step: WithdrawalStep, networkName: string): string {
    switch (step.id) {
        case 'initiate':
            if (step.contractName === 'ArbSys') {
                // Arbitrum flow
                return `To initiate the withdrawal, submit a transaction on ${networkName} (L2) by clicking "Initiate Withdrawal" and signing the request in your wallet. This calls the ${step.method} method on the ${step.contractName} contract (address ${step.contractAddress}). The transaction requires approximately ${step.estimatedGas} and takes ${step.estimatedTime} to confirm.`
            }
            // OP Stack flow
            return `To initiate the withdrawal, submit a transaction on ${networkName} (L2) by clicking "Initiate Withdrawal" and signing the request in your wallet. This calls the ${step.method} method on the ${step.contractName} contract (address ${step.contractAddress}). The transaction requires approximately ${step.estimatedGas} and takes ${step.estimatedTime} to confirm.`

        case 'wait_state_root':
            return `After initiation, the process enters an automatic waiting phase where the L2 state is proposed to L1. This step requires no user action and takes approximately ${step.estimatedTime} to complete. The status will update from "Waiting for state root proposal" to "State root proposed" when complete.`

        case 'prove':
            return `Once the state root is proposed, click "Prove Withdrawal" and sign a transaction on L1 to submit a merkle proof. This targets the ${step.contractName} contract (address ${step.contractAddress}) using the ${step.method} method. The transaction costs approximately ${step.estimatedGas} and takes about ${step.estimatedTime} to confirm.`

        case 'wait_challenge':
            return `The withdrawal enters a mandatory 7-day security window known as the Challenge Period on L1. This is a passive waiting period where no user action is required. The interface will track the remaining time until the challenge period is completed.`

        case 'finalize':
            if (step.contractName === 'Outbox') {
                // Arbitrum flow
                return `To complete the withdrawal and receive funds on L1, click "Execute Withdrawal" and sign the final transaction. This calls the ${step.method} method on the ${step.contractName} contract (address ${step.contractAddress}). The transaction takes approximately ${step.estimatedTime} and costs about ${step.estimatedGas}.`
            }
            // OP Stack flow
            return `To complete the withdrawal and receive funds on L1, click "Finalize Withdrawal" and sign the final transaction. This calls the ${step.method} method on the ${step.contractName} contract (address ${step.contractAddress}). The transaction takes approximately ${step.estimatedTime} and costs about ${step.estimatedGas}.`

        default:
            return step.description
    }
}

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

    // Generate steps from the selected network's withdrawal flow
    const steps = useMemo(() => {
        const withdrawalSteps = selectedNetwork.withdrawalSteps || []
        return withdrawalSteps.map((step) => ({
            id: step.order,
            title: step.name,
            description: generateStepDescription(step, selectedNetwork.name),
        }))
    }, [selectedNetwork])

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
                    {selectedNetwork.documentationUrls?.map((doc, index) => (
                        <a
                            key={index}
                            href={doc.url}
                            className={styles.externalLink}
                            aria-label={`${doc.label} (opens in new window)`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {doc.label}
                            <ExternalLink
                                className={styles.externalLinkIcon}
                                aria-hidden="true"
                            />
                        </a>
                    ))}
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
