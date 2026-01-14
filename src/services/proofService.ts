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
    l2ChainId: number
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

        // Check if state root has been published for this block
        const stateRootResult = await checkStateRootPublished(blockNumber, l2ChainId)

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
    l2ChainId: number
): Promise<{ success: boolean; proofData?: WithdrawalProofData; error?: string }> {
    try {
        console.log('🔍 Generating proof for transaction:', l2TransactionHash)
        console.log('📋 Step 1: Fetching withdrawal message from L2...')

        // Get withdrawal message
        const messageResult = await getWithdrawalMessage(l2TransactionHash, l2ChainId)

        if (!messageResult.success || !messageResult.message) {
            return {
                success: false,
                error: messageResult.error || 'Failed to get withdrawal message'
            }
        }

        console.log('✅ Withdrawal message found')
        console.log('📋 Step 2: Checking state root publication...')

        // Check state root
        const stateRootResult = await checkStateRootPublished(
            messageResult.message.blockNumber,
            l2ChainId
        )

        if (!stateRootResult.published) {
            return {
                success: false,
                error: 'State root not yet published. Please wait ~1 hour after transaction confirmation.'
            }
        }

        console.log('✅ State root published')
        console.log('📋 Step 3: Generating merkle proof...')

        // Determine L1 chain ID based on L2 chain ID
        const l1ChainId = l2ChainId === 11155420 ? 11155111 : 1

        // Try Method 1: Backend service (uses Optimism SDK with ethers v5)
        console.log('📋 Attempting proof generation via backend service...')
        const backendResult = await generateProofWithBackend(l2TransactionHash, l2ChainId, l1ChainId)

        if (backendResult.success && backendResult.proofData) {
            console.log('✅ Proof generated successfully via backend!')
            return backendResult
        }

        console.log('⚠️  Backend not available, trying Blockscout API...')

        // Try Method 2: Blockscout API (public API fallback)
        const blockscoutResult = await generateProofViaBlockscout(l2TransactionHash, l2ChainId)

        if (blockscoutResult.success && blockscoutResult.proofData) {
            console.log('✅ Proof generated successfully via Blockscout!')
            return blockscoutResult
        }

        console.log('❌ Both backend and Blockscout API unavailable')

        // Return helpful error with instructions
        return {
            success: false,
            error: `✅ Withdrawal initiated successfully!
❌ Backend service unavailable.

📋 Transaction Details:
- L2 Transaction: ${l2TransactionHash}
- Block: ${messageResult.message.blockNumber}
- Status: Ready to prove (state root published)

🔧 To enable proof generation:

Option 1 - Start Backend Service (Recommended):
1. cd server
2. npm install
3. cp .env.example .env
4. npm start
5. Backend will run on http://localhost:3001

Option 2 - Use Official Optimism Bridge:
Visit https://app.optimism.io/bridge to complete the withdrawal

Backend error: ${backendResult.error}
Blockscout error: ${blockscoutResult.error || 'API not available'}`
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

        console.log('📋 Submitting proof to OptimismPortal...')

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

        console.log('✅ Connected to OptimismPortal:', l1PortalAddress)
        console.log('📋 Estimating gas...')

        // Estimate gas for the transaction
        try {
            const gasEstimate = await portal.proveWithdrawalTransaction.estimateGas(
                proofData.withdrawalTransaction,
                proofData.l2OutputIndex,
                proofData.outputRootProof,
                proofData.withdrawalProof
            )

            console.log('✅ Gas estimate:', gasEstimate.toString())
        } catch (estimateError) {
            console.error('Gas estimation failed:', estimateError)
        }

        console.log('📋 Sending transaction...')

        // Call proveWithdrawalTransaction
        const tx = await portal.proveWithdrawalTransaction(
            proofData.withdrawalTransaction,
            proofData.l2OutputIndex,
            proofData.outputRootProof,
            proofData.withdrawalProof
        )

        console.log('⏳ Transaction sent:', tx.hash)
        console.log('📋 Waiting for confirmation...')

        // Wait for confirmation
        const receipt = await tx.wait()

        console.log('✅ Proof submitted successfully!')
        console.log('📋 Transaction hash:', receipt.hash)

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        console.error('❌ Error submitting proof:', error)

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

        console.log('Checking challenge period for:', withdrawalHash)

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

        console.log('📋 Finalizing withdrawal on L1...')

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

        console.log('✅ Connected to OptimismPortal:', l1PortalAddress)
        console.log('📋 Estimating gas...')

        // Estimate gas for the transaction
        try {
            const gasEstimate = await portal.finalizeWithdrawalTransaction.estimateGas(
                withdrawalTransaction
            )

            console.log('✅ Gas estimate:', gasEstimate.toString())
        } catch (estimateError) {
            console.error('Gas estimation failed:', estimateError)
        }

        console.log('📋 Sending finalization transaction...')

        // Call finalizeWithdrawalTransaction
        const tx = await portal.finalizeWithdrawalTransaction(
            withdrawalTransaction
        )

        console.log('⏳ Transaction sent:', tx.hash)
        console.log('📋 Waiting for confirmation...')

        // Wait for confirmation
        const receipt = await tx.wait()

        console.log('✅ Withdrawal finalized successfully!')
        console.log('🎉 Funds have been received on L1!')
        console.log('📋 Transaction hash:', receipt.hash)

        return {
            success: true,
            transactionHash: receipt.hash
        }
    } catch (error: any) {
        console.error('❌ Error finalizing withdrawal:', error)

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
