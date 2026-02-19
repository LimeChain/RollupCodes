import { useState, useEffect, useCallback } from 'react'
import { StoredWithdrawal, WithdrawalStatus, WithdrawalStepInfo } from '../types/withdrawal'
import {
    getAllWithdrawals,
    getWithdrawalsByAddress,
    getPendingWithdrawals,
    saveWithdrawal,
    updateWithdrawalStatus,
    deleteWithdrawal,
    isChallengePeriodComplete,
    getChallengeTimeRemaining
} from '@services/withdrawalStorage'
import { ExitHatchSpec } from '@utils/types'

export function useWithdrawals(walletAddress?: string) {
    const [withdrawals, setWithdrawals] = useState<StoredWithdrawal[]>([])
    const [loading, setLoading] = useState(true)

    const loadWithdrawals = useCallback(() => {
        setLoading(true)
        const allWithdrawals = walletAddress
            ? getWithdrawalsByAddress(walletAddress)
            : getAllWithdrawals()
        setWithdrawals(allWithdrawals)
        setLoading(false)
    }, [walletAddress])

    useEffect(() => {
        loadWithdrawals()
    }, [loadWithdrawals])

    const refresh = useCallback(() => {
        loadWithdrawals()
    }, [loadWithdrawals])

    return {
        withdrawals,
        pendingWithdrawals: withdrawals.filter(w => w.status !== 'finalized' && w.status !== 'failed'),
        completedWithdrawals: withdrawals.filter(w => w.status === 'finalized'),
        failedWithdrawals: withdrawals.filter(w => w.status === 'failed'),
        loading,
        refresh
    }
}

export function useWithdrawal(withdrawalId: string) {
    const [withdrawal, setWithdrawal] = useState<StoredWithdrawal | null>(null)
    const [loading, setLoading] = useState(true)

    const loadWithdrawal = useCallback(() => {
        setLoading(true)
        const allWithdrawals = getAllWithdrawals()
        const found = allWithdrawals.find(w => w.id === withdrawalId)
        setWithdrawal(found || null)
        setLoading(false)
    }, [withdrawalId])

    useEffect(() => {
        loadWithdrawal()
    }, [loadWithdrawal])

    const updateStatus = useCallback(
        (status: WithdrawalStatus, updates?: Partial<StoredWithdrawal>) => {
            const success = updateWithdrawalStatus(withdrawalId, status, updates)
            if (success) {
                loadWithdrawal()
            }
            return success
        },
        [withdrawalId, loadWithdrawal]
    )

    const remove = useCallback(() => {
        return deleteWithdrawal(withdrawalId)
    }, [withdrawalId])

    return {
        withdrawal,
        loading,
        updateStatus,
        remove,
        refresh: loadWithdrawal
    }
}

/**
 * Get step information for a withdrawal based on current status
 */
export function getWithdrawalSteps(
    withdrawal: StoredWithdrawal,
    networkSpec: ExitHatchSpec
): WithdrawalStepInfo[] {
    const steps = networkSpec.withdrawal_flow.steps

    return steps.map((step, index) => {
        const stepNumber = index + 1
        let status: 'pending' | 'in_progress' | 'completed' | 'failed' = 'pending'
        let canExecute = false
        let transactionHash: string | undefined
        let timestamp: number | undefined

        // Determine status based on withdrawal state
        switch (step.id) {
            case 'initiate':
                if (withdrawal.status === 'initiated' ||
                    withdrawal.status === 'waiting_state_root' ||
                    withdrawal.status === 'ready_to_prove' ||
                    withdrawal.status === 'proven' ||
                    withdrawal.status === 'waiting_challenge' ||
                    withdrawal.status === 'ready_to_finalize' ||
                    withdrawal.status === 'finalized') {
                    status = 'completed'
                    transactionHash = withdrawal.transactionHash
                    timestamp = withdrawal.initiatedAt
                }
                break

            case 'wait_state_root':
                if (withdrawal.status === 'waiting_state_root') {
                    status = 'in_progress'
                } else if (withdrawal.status === 'ready_to_prove' ||
                    withdrawal.status === 'proven' ||
                    withdrawal.status === 'waiting_challenge' ||
                    withdrawal.status === 'ready_to_finalize' ||
                    withdrawal.status === 'finalized') {
                    status = 'completed'
                    timestamp = withdrawal.stateRootPublishedAt
                }
                break

            case 'prove':
                if (withdrawal.status === 'ready_to_prove') {
                    status = 'in_progress'
                    canExecute = true
                } else if (withdrawal.status === 'proven' ||
                    withdrawal.status === 'waiting_challenge' ||
                    withdrawal.status === 'ready_to_finalize' ||
                    withdrawal.status === 'finalized') {
                    status = 'completed'
                    transactionHash = withdrawal.proveTransactionHash
                    timestamp = withdrawal.provenAt
                }
                break

            case 'wait_challenge':
                if (withdrawal.status === 'waiting_challenge') {
                    status = 'in_progress'
                } else if (withdrawal.status === 'ready_to_finalize' || withdrawal.status === 'finalized') {
                    status = 'completed'
                    timestamp = withdrawal.challengePeriodEndsAt
                }
                break

            case 'finalize':
                if (withdrawal.status === 'ready_to_finalize') {
                    status = 'in_progress'
                    canExecute = true
                } else if (withdrawal.status === 'finalized') {
                    status = 'completed'
                    transactionHash = withdrawal.finalizeTransactionHash
                    timestamp = withdrawal.finalizedAt
                }
                break
        }

        if (withdrawal.status === 'failed') {
            status = 'failed'
        }

        return {
            stepNumber,
            stepId: step.id,
            name: step.name,
            description: step.description,
            status,
            canExecute,
            transactionHash,
            timestamp
        }
    })
}

/**
 * Check if a withdrawal can progress to next step
 */
export function canProgressWithdrawal(withdrawal: StoredWithdrawal): boolean {
    switch (withdrawal.status) {
        case 'ready_to_prove':
        case 'ready_to_finalize':
            return true
        case 'waiting_challenge':
            return isChallengePeriodComplete(withdrawal)
        default:
            return false
    }
}

/**
 * Get user-friendly status text
 */
export function getWithdrawalStatusText(withdrawal: StoredWithdrawal): string {
    switch (withdrawal.status) {
        case 'initiated':
            return 'Withdrawal Initiated'
        case 'waiting_state_root':
            return 'Waiting for State Root'
        case 'ready_to_prove':
            return 'Ready to Prove'
        case 'proven':
            return 'Proof Submitted'
        case 'waiting_challenge':
            return `Challenge Period (${getChallengeTimeRemaining(withdrawal)} remaining)`
        case 'ready_to_finalize':
            return 'Ready to Finalize'
        case 'finalized':
            return 'Completed'
        case 'failed':
            return 'Failed'
        default:
            return 'Unknown'
    }
}
