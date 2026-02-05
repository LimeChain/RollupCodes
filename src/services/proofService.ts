import { BrowserProvider, Contract } from 'ethers'
import OptimismPortalABI from '@contracts/abis/OptimismPortal.json'
import { getWithdrawalMessage, checkStateRootPublished } from './optimismApi'
import { generateProofWithBackend, generateProofViaBlockscout } from './optimismSdkWrapper'

/**
 * Optimism Proof Service
 * Handles proof generation and retrieval for withdrawal transactions
 */

export interface WithdrawalMessage {
    nonce: bigint
    sender: string
    target: string
    value: bigint
    gasLimit: bigint
    data: string
}

export interface OutputRootProof {
    version: string
    stateRoot: string
    messagePasserStorageRoot: string
    latestBlockhash: string
}

export interface WithdrawalProofData {
    withdrawalTransaction: WithdrawalMessage
    l2OutputIndex: number
    outputRootProof: OutputRootProof
    withdrawalProof: string[]
}

/**
 * Check if withdrawal is ready to be proven (state root published)
 * Uses Optimism's public API
 */
export async function isWithdrawalReadyToProve(
    l2TransactionHash: string,
    l2ChainId: number,
    l1ChainId?: number
): Promise<{ ready: boolean; timeRemaining?: string; error?: string; blockNumber?: number }> {
    try {
        // Get withdrawal message to extract block number
        const messageResult = await getWithdrawalMessage(l2TransactionHash, l2ChainId)

        if (!messageResult.success || !messageResult.message) {
            return {
                ready: false,
                error: messageResult.error || 'Failed to get withdrawal message'
            }
        }

        const blockNumber = messageResult.message.blockNumber

        // Determine L1 chain ID if not provided (default mapping)
        const resolvedL1ChainId = l1ChainId || (l2ChainId === 11155420 ? 11155111 : 1)

        // Check if state root has been published for this block
        const stateRootResult = await checkStateRootPublished(blockNumber, l2ChainId, resolvedL1ChainId)

        if (stateRootResult.published) {
            return {
                ready: true,
                blockNumber
            }
        }

        return {
            ready: false,
            timeRemaining: 'Waiting for state root to be published (~1 hour)',
            blockNumber
        }
    } catch (error) {
        console.error('Error checking withdrawal readiness:', error)
        return {
            ready: false,
            error: 'Failed to check withdrawal status'
        }
    }
}

/**
 * Generate proof for withdrawal
 *
 * IMPLEMENTATION OPTIONS:
 *
 * 1. Use Optimism SDK (Recommended but has ethers v5 dependency):
 *    ```
 *    import { CrossChainMessenger } from '@eth-optimism/sdk'
 *    const messenger = new CrossChainMessenger({ l1Signer, l2Signer, ... })
 *    const proof = await messenger.getBedrockMessageProof(txHash)
 *    ```
 *
 * 2. Call Optimism Blockscout API (if available):
 *    GET https://optimism-sepolia.blockscout.com/api/v2/optimism/withdrawals/{hash}
 *
 * 3. Use viem + manual proof construction (Advanced):
 *    - Query L2 state for withdrawal message
 *    - Build merkle proof from storage
 *    - Get output root from L2OutputOracle
 */
export async function generateWithdrawalProof(
    l2TransactionHash: string,
    l2ChainId: number,
    l1ChainId?: number
): Promise<{ success: boolean; proofData?: WithdrawalProofData; error?: string }> {
    try {
        // Get withdrawal message
        const messageResult = await getWithdrawalMessage(l2TransactionHash, l2ChainId)

        if (!messageResult.success || !messageResult.message) {
            return {
                success: false,
                error: messageResult.error || 'Failed to get withdrawal message'
            }
        }

        // Determine L1 chain ID if not provided (default mapping)
        const resolvedL1ChainId = l1ChainId || (l2ChainId === 11155420 ? 11155111 : 1)

        // Check state root
        const stateRootResult = await checkStateRootPublished(
            messageResult.message.blockNumber,
            l2ChainId,
            resolvedL1ChainId
        )

        if (!stateRootResult.published) {
            return {
                success: false,
                error: 'State root not yet published. Please wait ~1 hour after transaction confirmation.'
            }
        }

        // Try Method 1: Backend service (uses Optimism SDK with ethers v5)
        const backendResult = await generateProofWithBackend(l2TransactionHash, l2ChainId, resolvedL1ChainId)

        if (backendResult.success && backendResult.proofData) {
            return backendResult
        }

        // Try Method 2: Blockscout API (public API fallback)
        const blockscoutResult = await generateProofViaBlockscout(l2TransactionHash, l2ChainId)

        if (blockscoutResult.success && blockscoutResult.proofData) {
            return blockscoutResult
        }

        // Return helpful error with instructions
        return {
            success: false,
            error: `Backend service unavailable. Transaction ${l2TransactionHash} is ready to prove. Start the backend server or use the official Optimism Bridge at https://app.optimism.io/bridge`
        }
    } catch (error: any) {
        console.error('Error generating proof:', error)
        return {
            success: false,
            error: error.message || 'Failed to generate proof'
        }
    }
}

/**
 * Submit proof to L1 OptimismPortal contract
 *
 * This function calls OptimismPortal.proveWithdrawalTransaction() on L1
 */
export async function submitProof(
    proofData: WithdrawalProofData,
    l1PortalAddress: string,
    l1ChainId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask not installed' }
        }

        // Check if on correct L1 network
        const provider = new BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()

        if (Number(network.chainId) !== l1ChainId) {
            return {
                success: false,
                error: `Please switch to L1 network (chain ID: ${l1ChainId})`
            }
        }

        const signer = await provider.getSigner()

        // Create contract instance
        const portal = new Contract(
            l1PortalAddress,
            OptimismPortalABI,
            signer
        )

        // Call proveWithdrawalTransaction
        const tx = await portal.proveWithdrawalTransaction(
            proofData.withdrawalTransaction,
            proofData.l2OutputIndex,
            proofData.outputRootProof,
            proofData.withdrawalProof
        )

        // Wait for confirmation
        const receipt = await tx.wait()

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        console.error('Error submitting proof:', error)

        let errorMessage = 'Failed to submit proof'

        if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user'
        } else if (error.message?.includes('already proven')) {
            errorMessage = 'This withdrawal has already been proven'
        } else if (error.message) {
            errorMessage = error.message
        }

        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Check if withdrawal challenge period has completed
 */
export async function isChallengePeriodCompleteOnChain(
    withdrawalHash: string,
    l1PortalAddress: string
): Promise<{ complete: boolean; timeRemaining?: number; error?: string }> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { complete: false, error: 'MetaMask not installed' }
        }

        // TODO: Query OptimismPortal.provenWithdrawals(withdrawalHash)
        // Check if timestamp + FINALIZATION_PERIOD has passed

        return {
            complete: false,
            error: 'Challenge period check not yet implemented'
        }
    } catch (error: any) {
        console.error('Error checking challenge period:', error)
        return {
            complete: false,
            error: error.message || 'Failed to check challenge period'
        }
    }
}

/**
 * Finalize withdrawal on L1
 *
 * This function calls OptimismPortal.finalizeWithdrawalTransaction() on L1
 * to claim the funds after the challenge period has passed
 */
export async function finalizeWithdrawalOnL1(
    withdrawalTransaction: WithdrawalMessage,
    l1PortalAddress: string,
    l1ChainId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
        if (typeof window.ethereum === 'undefined') {
            return { success: false, error: 'MetaMask not installed' }
        }

        // Check if on correct L1 network
        const provider = new BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()

        if (Number(network.chainId) !== l1ChainId) {
            return {
                success: false,
                error: `Please switch to L1 network (chain ID: ${l1ChainId})`
            }
        }

        const signer = await provider.getSigner()

        // Create contract instance
        const portal = new Contract(
            l1PortalAddress,
            OptimismPortalABI,
            signer
        )

        // Call finalizeWithdrawalTransaction
        const tx = await portal.finalizeWithdrawalTransaction(
            withdrawalTransaction
        )

        // Wait for confirmation
        const receipt = await tx.wait()

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        console.error('Error finalizing withdrawal:', error)

        let errorMessage = 'Failed to finalize withdrawal'

        if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user'
        } else if (error.message?.includes('already finalized')) {
            errorMessage = 'This withdrawal has already been finalized'
        } else if (error.message?.includes('challenge period')) {
            errorMessage = 'Challenge period has not ended yet. Please wait.'
        } else if (error.message) {
            errorMessage = error.message
        }

        return {
            success: false,
            error: errorMessage
        }
    }
}

/**
 * Helper: Calculate withdrawal hash for tracking
 */
export function calculateWithdrawalHash(
    withdrawalTransaction: WithdrawalMessage
): string {
    // TODO: Implement proper withdrawal hash calculation
    // This should match Optimism's withdrawal hash algorithm
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
}

/**
 * Estimate gas for proving withdrawal
 */
export async function estimateProveGas(): Promise<bigint> {
    // Typical gas for prove transaction on L1
    return BigInt(250000)
}

/**
 * Estimate gas for finalizing withdrawal
 */
export async function estimateFinalizeGas(): Promise<bigint> {
    // Typical gas for finalize transaction on L1
    return BigInt(220000)
}
