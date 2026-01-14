import { StoredWithdrawal } from '../types/withdrawal'
import { updateWithdrawalStatus } from './withdrawalStorage'
import { switchToNetwork } from '@utils/networkUtils'
import {
    isWithdrawalReadyToProve,
    generateWithdrawalProof,
    submitProof,
    finalizeWithdrawalOnL1
} from './proofService'
import {
    checkAndUpdateArbitrumWithdrawalStatus,
    executeArbitrumWithdrawalOnL1
} from './arbitrumFlowService'

/**
 * Execute the prove withdrawal step (Step 3)
 */
export async function executeProveWithdrawal(
    withdrawal: StoredWithdrawal
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
        // Step 1: Check if ready to prove
        const readiness = await isWithdrawalReadyToProve(
            withdrawal.transactionHash,
            withdrawal.sourceChainId
        )

        if (!readiness.ready) {
            return {
                success: false,
                error: readiness.error || readiness.timeRemaining || 'Not ready to prove'
            }
        }

        // Step 2: Switch to L1 network
        const switchResult = await switchToNetwork(123)
        if (!switchResult.success) {
            return {
                success: false,
                error: `Please switch to L1 network: ${switchResult.error}`
            }
        }

        // Wait for network switch
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Step 3: Generate proof
        const proofResult = await generateWithdrawalProof(
            withdrawal.transactionHash,
            withdrawal.sourceChainId
        )

        if (!proofResult.success || !proofResult.proofData) {
            return {
                success: false,
                error: proofResult.error || 'Failed to generate proof'
            }
        }

        // Step 4: Submit proof to L1
        const submitResult = await submitProof(
            proofResult.proofData,
            "l1PortalAddress",
            123
        )

        if (submitResult.success && submitResult.transactionHash) {
            // Update withdrawal status
            updateWithdrawalStatus(withdrawal.id, 'proven', {
                proveTransactionHash: submitResult.transactionHash,
                provenAt: Date.now(),
                challengePeriodEndsAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
                currentStep: 4
            })

            return {
                success: true,
                transactionHash: submitResult.transactionHash
            }
        }

        return {
            success: false,
            error: submitResult.error || 'Failed to submit proof'
        }
    } catch (error: any) {
        console.error('Error executing prove withdrawal:', error)
        return {
            success: false,
            error: error.message || 'Failed to prove withdrawal'
        }
    }
}

/**
 * Execute the finalize withdrawal step (Step 5)
 */
export async function executeFinalizeWithdrawal(
    withdrawal: StoredWithdrawal
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
        // Step 1: Check if challenge period has passed
        if (withdrawal.challengePeriodEndsAt && Date.now() < withdrawal.challengePeriodEndsAt) {
            const timeRemaining = Math.ceil(
                (withdrawal.challengePeriodEndsAt - Date.now()) / (1000 * 60 * 60)
            )
            return {
                success: false,
                error: `Challenge period not complete. ${timeRemaining} hours remaining.`
            }
        }

        // Step 2: Switch to L1 network
        const switchResult = await switchToNetwork(123)
        if (!switchResult.success) {
            return {
                success: false,
                error: `Please switch to L1 network: ${switchResult.error}`
            }
        }

        // Wait for network switch
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Step 3: Finalize withdrawal
        // Note: This requires the withdrawal transaction data from the proof step
        // For now, we'll return a stub response
        const finalizeResult = await finalizeWithdrawalOnL1(
            {
                nonce: BigInt(0),
                sender: "fromAddress",
                target: withdrawal.toAddress,
                value: BigInt(0),
                gasLimit: BigInt(200000),
                data: '0x'
            },
            "l1PortalAddress",
            123
        )

        if (finalizeResult.success && finalizeResult.transactionHash) {
            // Update withdrawal status
            updateWithdrawalStatus(withdrawal.id, 'finalized', {
                finalizeTransactionHash: finalizeResult.transactionHash,
                finalizedAt: Date.now(),
                currentStep: 5
            })

            return {
                success: true,
                transactionHash: finalizeResult.transactionHash
            }
        }

        return {
            success: false,
            error: finalizeResult.error || 'Failed to finalize withdrawal'
        }
    } catch (error: any) {
        console.error('Error executing finalize withdrawal:', error)
        return {
            success: false,
            error: error.message || 'Failed to finalize withdrawal'
        }
    }
}

/**
 * Check withdrawal status and update if needed
 * This can be called periodically to auto-update withdrawal states
 */
export async function checkAndUpdateWithdrawalStatus(
    withdrawal: StoredWithdrawal
): Promise<StoredWithdrawal> {
    try {
        console.log('🔍 Checking withdrawal status for:', withdrawal.transactionHash)
        console.log('📋 Current status:', withdrawal.status)

        switch (withdrawal.status) {
            case 'initiated':
            case 'waiting_state_root':
                // Check if ready to prove
                console.log('📋 Checking if ready to prove...')
                const readiness = await isWithdrawalReadyToProve(
                    withdrawal.transactionHash,
                    withdrawal.sourceChainId
                )
                console.log('📋 Readiness result:', readiness)

                if (readiness.ready) {
                    console.log('✅ Withdrawal is ready to prove! Updating status...')
                    updateWithdrawalStatus(withdrawal.id, 'ready_to_prove', {
                        stateRootPublishedAt: Date.now(),
                        currentStep: 3
                    })
                    return { ...withdrawal, status: 'ready_to_prove', currentStep: 3 }
                } else {
                    console.log('⏳ Not ready yet:', readiness.timeRemaining || readiness.error)
                    if (withdrawal.status === 'initiated') {
                        updateWithdrawalStatus(withdrawal.id, 'waiting_state_root', {
                            currentStep: 2
                        })
                        return { ...withdrawal, status: 'waiting_state_root', currentStep: 2 }
                    }
                }
                break

            case 'proven':
            case 'waiting_challenge':
                // Check if challenge period has passed
                if (withdrawal.challengePeriodEndsAt && Date.now() >= withdrawal.challengePeriodEndsAt) {
                    updateWithdrawalStatus(withdrawal.id, 'ready_to_finalize', {
                        currentStep: 5
                    })
                    return { ...withdrawal, status: 'ready_to_finalize', currentStep: 5 }
                } else if (withdrawal.status === 'proven') {
                    updateWithdrawalStatus(withdrawal.id, 'waiting_challenge', {
                        currentStep: 4
                    })
                    return { ...withdrawal, status: 'waiting_challenge', currentStep: 4 }
                }
                break
        }

        return withdrawal
    } catch (error) {
        console.error('Error checking withdrawal status:', error)
        return withdrawal
    }
}

/**
 * Poll withdrawal status periodically
 */
export function startWithdrawalStatusPolling(
    withdrawal: StoredWithdrawal,
    callback: (updated: StoredWithdrawal) => void,
    intervalMs: number = 60000 // 1 minute
): () => void {
    const intervalId = setInterval(async () => {
        const updated = await checkAndUpdateWithdrawalStatus(withdrawal)
        if (updated.status !== withdrawal.status) {
            callback(updated)
        }
    }, intervalMs)

    // Return cleanup function
    return () => clearInterval(intervalId)
}

/**
 * Multi-chain dispatcher functions
 * Routes withdrawal operations to the appropriate rollup-specific service
 */

/**
 * Universal status checker that routes to the appropriate rollup implementation
 */
export async function checkAndUpdateWithdrawalStatusUniversal(
    withdrawal: StoredWithdrawal
): Promise<StoredWithdrawal> {
    const rollupType = withdrawal.rollupType || 'optimism'

    console.log(`🔍 Checking ${rollupType} withdrawal status for:`, withdrawal.transactionHash)

    switch (rollupType) {
        case 'arbitrum':
            return await checkAndUpdateArbitrumWithdrawalStatus(withdrawal)

        case 'optimism':
        case 'base':
        default:
            return await checkAndUpdateWithdrawalStatus(withdrawal)
    }
}

/**
 * Universal execute step function that routes to the appropriate implementation
 */
export async function executeWithdrawalStep(
    withdrawal: StoredWithdrawal,
    stepId: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    const rollupType = withdrawal.rollupType || 'optimism'

    console.log(`🎯 Executing ${rollupType} withdrawal step:`, stepId)

    switch (rollupType) {
        case 'arbitrum':
            if (stepId === 'finalize' || stepId === 'execute') {
                return await executeArbitrumWithdrawalOnL1(
                    withdrawal.id,
                    withdrawal.transactionHash,
                    withdrawal.sourceChainId,
                    withdrawal.outboxAddress || '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840'
                )
            }
            return {
                success: false,
                error: `Unknown Arbitrum step: ${stepId}`
            }

        case 'optimism':
        case 'base':
        default:
            if (stepId === 'prove') {
                return await executeProveWithdrawal(withdrawal)
            } else if (stepId === 'finalize') {
                return await executeFinalizeWithdrawal(withdrawal)
            }
            return {
                success: false,
                error: `Unknown Optimism step: ${stepId}`
            }
    }
}
