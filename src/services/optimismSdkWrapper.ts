/**
 * Optimism SDK Wrapper
 *
 * Provides functions to call the backend service for proof generation.
 * The actual SDK logic runs on the backend (server/) with ethers v5.
 */

import { WithdrawalProofData } from './proofService'

/**
 * Generate proof using backend service
 * Calls our Node.js backend which has the Optimism SDK with ethers v5
 */
export async function generateProofWithBackend(
    l2TransactionHash: string,
    l2ChainId: number,
    l1ChainId: number
): Promise<{ success: boolean; proofData?: WithdrawalProofData; error?: string }> {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
    const isDev = process.env.NODE_ENV !== 'production'

    // Check if backend is reachable
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const healthCheck = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!healthCheck.ok) {
            return {
                success: false,
                error: isDev
                    ? `Backend server is not healthy. Please start the backend:\n1. cd server\n2. npm install\n3. npm run dev`
                    : 'Backend service unavailable. Please try again later.'
            }
        }
    } catch (healthError: any) {
        return {
            success: false,
            error: isDev
                ? `Cannot connect to backend at ${backendUrl}\n\nTo start it:\n1. cd server\n2. npm install\n3. npm run dev`
                : 'Unable to connect to backend service. Please try again later.'
        }
    }

    // Generate proof via backend
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(`${backendUrl}/api/withdrawal/generate-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: l2TransactionHash, l2ChainId, l1ChainId }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))

            if (error.statusCode === 2) {
                return {
                    success: false,
                    error: 'Withdrawal not ready yet. Please wait ~1 hour after initiating, then try again.'
                }
            }

            return {
                success: false,
                error: error.error || `Backend error: ${response.status}`
            }
        }

        const data = await response.json()

        if (!data.success || !data.proofData) {
            return { success: false, error: 'Invalid response from backend' }
        }

        // Convert string values back to BigInt
        const proofData: WithdrawalProofData = {
            withdrawalTransaction: {
                nonce: BigInt(data.proofData.withdrawalTransaction.nonce),
                sender: data.proofData.withdrawalTransaction.sender,
                target: data.proofData.withdrawalTransaction.target,
                value: BigInt(data.proofData.withdrawalTransaction.value),
                gasLimit: BigInt(data.proofData.withdrawalTransaction.gasLimit),
                data: data.proofData.withdrawalTransaction.data
            },
            l2OutputIndex: data.proofData.l2OutputIndex,
            outputRootProof: {
                version: data.proofData.outputRootProof.version,
                stateRoot: data.proofData.outputRootProof.stateRoot,
                messagePasserStorageRoot: data.proofData.outputRootProof.messagePasserStorageRoot,
                latestBlockhash: data.proofData.outputRootProof.latestBlockhash
            },
            withdrawalProof: data.proofData.withdrawalProof
        }

        return { success: true, proofData }
    } catch (error: any) {
        return {
            success: false,
            error: `Failed to generate proof: ${error.name === 'AbortError' ? 'Request timeout' : error.message}`
        }
    }
}

/**
 * Try to fetch proof via Blockscout API (fallback)
 */
export async function generateProofViaBlockscout(
    l2TransactionHash: string,
    l2ChainId: number
): Promise<{ success: boolean; proofData?: WithdrawalProofData; error?: string }> {
    const apiUrl = l2ChainId === 11155420
        ? 'https://optimism-sepolia.blockscout.com/api/v2'
        : 'https://optimism.blockscout.com/api/v2'

    try {
        const response = await fetch(`${apiUrl}/optimism/withdrawals/${l2TransactionHash}`)

        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, error: 'Withdrawal not found in Blockscout.' }
            }
            return { success: false, error: `Blockscout API error: ${response.status}` }
        }

        const data = await response.json()

        if (data.l2_output_index && data.output_root_proof && data.withdrawal_proof) {
            const proofData: WithdrawalProofData = {
                withdrawalTransaction: {
                    nonce: BigInt(data.nonce || 0),
                    sender: data.from,
                    target: data.to || data.l1_token,
                    value: BigInt(data.value || 0),
                    gasLimit: BigInt(data.gas_limit || 200000),
                    data: data.data || '0x'
                },
                l2OutputIndex: data.l2_output_index,
                outputRootProof: {
                    version: data.output_root_proof.version,
                    stateRoot: data.output_root_proof.state_root,
                    messagePasserStorageRoot: data.output_root_proof.message_passer_storage_root,
                    latestBlockhash: data.output_root_proof.latest_blockhash
                },
                withdrawalProof: data.withdrawal_proof
            }

            return { success: true, proofData }
        }

        return { success: false, error: 'Proof data not yet available from Blockscout.' }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch proof from Blockscout' }
    }
}
