import { WithdrawalStepInfo } from '../../types/withdrawal'
import styles from './styles.module.scss'

interface WithdrawalStepperProps {
    steps: WithdrawalStepInfo[]
    onExecuteStep?: (stepId: string) => void
    isExecuting?: boolean
}

const WithdrawalStepper = ({ steps, onExecuteStep, isExecuting = false }: WithdrawalStepperProps) => {
    const getStepIcon = (status: WithdrawalStepInfo['status'], num: number) => {
        switch (status) {
            case 'completed':
                return '✓'
            case 'in_progress':
                return '⋯'
            case 'failed':
                return '✕'
            default:
                return num.toString()
        }
    }

    const getStepClass = (status: WithdrawalStepInfo['status']) => {
        switch (status) {
            case 'completed':
                return styles.completed
            case 'in_progress':
                return styles.inProgress
            case 'failed':
                return styles.failed
            default:
                return styles.pending
        }
    }

    return (
        <div className={styles.stepper}>
            {steps.map((step, index) => {
                const stepNumber = step.stepNumber
                const isLast = index === steps.length - 1

                return (
                    <div key={step.stepId} className={styles.stepContainer}>
                        <div className={styles.stepContent}>
                            <div className={`${styles.stepCircle} ${getStepClass(step.status)}`}>
                                {getStepIcon(step.status, stepNumber)}
                            </div>
                            <div className={styles.stepDetails}>
                                <h4 className={styles.stepName}>{step.name}</h4>
                                <p className={styles.stepDescription}>{step.description}</p>
                                {step.transactionHash && (
                                    <div className={styles.stepTransaction}>
                                        Tx: {step.transactionHash.substring(0, 10)}...{step.transactionHash.substring(58)}
                                    </div>
                                )}
                                {step.canExecute && onExecuteStep && (
                                    <button
                                        className={styles.executeButton}
                                        onClick={() => onExecuteStep(step.stepId)}
                                        disabled={isExecuting}
                                        type="button"
                                    >
                                        {isExecuting ? (
                                            <>
                                                <span className={styles.spinner}></span>
                                                {step.stepId === 'prove' ? 'Submitting Proof...' : 'Finalizing...'}
                                            </>
                                        ) : (
                                            step.stepId === 'prove' ? 'Submit Proof' : 'Finalize Withdrawal'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                        {!isLast && (
                            <div className={`${styles.stepConnector} ${step.status === 'completed' ? styles.completed : ''}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default WithdrawalStepper
