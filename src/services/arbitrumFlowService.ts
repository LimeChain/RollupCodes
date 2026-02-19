/**
 * Arbitrum Withdrawal Flow Service
 * Orchestrates the 3-step withdrawal process for Arbitrum
 *
 * Steps:
 * 1. Initiate withdrawal on L2 (ArbSys.withdrawEth)
 * 2. Wait for 7-day challenge period
 * 3. Execute withdrawal on L1 Outbox
 */

import {
    initiateArbitrumWithdrawal,
    executeOutboxTransaction,
    type ArbitrumWithdrawalParams,
    type OutboxExecutionParams
} from './arbitrumWithdrawalService'
import {
    getArbitrumWithdrawalMessage,
    checkChallengePeriodPassed,
    isArbitrumWithdrawalReadyToExecute,
    getOutboxProofData
} from './arbitrumApi'
import { saveWithdrawal, updateWithdrawalStatus, generateWithdrawalId } from './withdrawalStorage'
import type { StoredWithdrawal } from '../types/withdrawal'

export type ArbitrumWithdrawalStatus =
    | 'initiated'
    | 'waiting_challenge'
    | 'ready_to_execute'
    | 'executing'
    | 'completed'
    | 'failed'

/**
 * Step 1: Initiate withdrawal on Arbitrum L2
 */
export async function initiateArbitrumWithdrawalFlow(
    amount: string,
    toAddress: string,
    arbSysAddress: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
    try {
        // Initiate withdrawal
        const result = await initiateArbitrumWithdrawal({
            amount,
            toAddress,
            arbSysAddress
        })

        if (!result.success || !result.transactionHash) {
            return {
                success: false,
                error: result.error || 'Failed to initiate withdrawal'
            }
        }

        // Save withdrawal to storage
        const withdrawalId = generateWithdrawalId(result.transactionHash, toAddress)
        const withdrawal: StoredWithdrawal = {
            id: withdrawalId,
            transactionHash: result.transactionHash,
            amount,
            toAddress,
            sourceChainId: l2ChainId,
            targetChainId: l1ChainId,
            status: 'initiated',
            createdAt: Date.now(),
            currentStep: 1,
            rollupType: 'arbitrum'
        }

        saveWithdrawal(withdrawal)

        // Update status to waiting_challenge after a brief delay
        setTimeout(() => {
            updateWithdrawalStatus(withdrawalId, 'waiting_challenge' as any, {
                currentStep: 2
            })
        }, 5000)

        return {
            success: true,
            withdrawalId
        }

    } catch (error: any) {
        console.error('Error in Arbitrum withdrawal flow:', error)
        return {
            success: false,
            error: error.message || 'Failed to initiate withdrawal flow'
        }
    }
}

/**
 * Step 3: Execute withdrawal on L1 Outbox
 */
export async function executeArbitrumWithdrawalOnL1(
    withdrawalId: string,
    txHash: string,
    l2ChainId: number,
    outboxAddress: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
        // Check if ready to execute
        const readinessCheck = await isArbitrumWithdrawalReadyToExecute(txHash, l2ChainId)

        if (!readinessCheck.ready) {
            return {
                success: false,
                error: readinessCheck.error || 'Withdrawal not ready to execute'
            }
        }

        // Get the L1 chain ID from withdrawal storage or determine from L2 chain ID
        const l1ChainId = l2ChainId === 42161 ? 1 : 11155111 // Arbitrum mainnet -> Ethereum, Sepolia -> Sepolia

        // Get proof data
        const proofResult = await getOutboxProofData(txHash, l2ChainId, l1ChainId)

        if (!proofResult.success || !proofResult.proofData) {
            return {
                success: false,
                error: proofResult.error || 'Failed to get proof data'
            }
        }

        // Update status to executing
        updateWithdrawalStatus(withdrawalId, 'executing' as any, {
            currentStep: 3
        })

        // Execute on L1
        const executionParams: OutboxExecutionParams = {
            ...proofResult.proofData,
            outboxAddress
        }

        const result = await executeOutboxTransaction(executionParams)

        if (!result.success) {
            updateWithdrawalStatus(withdrawalId, 'failed' as any)
            return {
                success: false,
                error: result.error || 'Failed to execute withdrawal on L1'
            }
        }

        // Update status to completed
        updateWithdrawalStatus(withdrawalId, 'completed' as any, {
            completedAt: Date.now(),
            finalTransactionHash: result.transactionHash
        })

        return {
            success: true,
            transactionHash: result.transactionHash
        }

    } catch (error: any) {
        console.error('Error executing Arbitrum withdrawal:', error)
        updateWithdrawalStatus(withdrawalId, 'failed' as any)
        return {
            success: false,
            error: error.message || 'Failed to execute withdrawal'
        }
    }
}

/**
 * Check and update Arbitrum withdrawal status
 */
export async function checkAndUpdateArbitrumWithdrawalStatus(
    withdrawal: StoredWithdrawal
): Promise<StoredWithdrawal> {
    try {
        switch (withdrawal.status) {
            case 'initiated':
            case 'waiting_challenge':
                // Check if challenge period has passed
                const readiness = await isArbitrumWithdrawalReadyToExecute(
                    withdrawal.transactionHash,
                    withdrawal.sourceChainId
                )

                if (readiness.ready) {
                    updateWithdrawalStatus(withdrawal.id, 'ready_to_execute' as any, {
                        challengePassedAt: Date.now(),
                        currentStep: 3
                    })
                    return {
                        ...withdrawal,
                        status: 'ready_to_execute' as any,
                        currentStep: 3
                    }
                }
                break

            case 'ready_to_execute':
            case 'completed':
                // No action needed
                break
        }

        return withdrawal

    } catch (error: any) {
        console.error('Error checking Arbitrum withdrawal status:', error)
        return withdrawal
    }
}
