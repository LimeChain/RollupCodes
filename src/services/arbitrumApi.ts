/**
 * Arbitrum API Service
 * Handles tracking withdrawal status and fetching outbox proof data
 */

export interface ArbitrumWithdrawalMessage {
    hash: string
    position: number
    arbBlockNum: number
    ethBlockNum: number
    timestamp: number
    callvalue: string
    sender: string
    destination: string
    data: string
}

export interface OutboxProofData {
    proof: string[]
    index: number
    l2Sender: string
    to: string
    l2Block: number
    l1Block: number
    l2Timestamp: number
    value: string
    data: string
}

/**
 * Get withdrawal message details from L2 transaction
 */
export async function getArbitrumWithdrawalMessage(
    txHash: string,
    l2ChainId: number
): Promise<{ success: boolean; message?: ArbitrumWithdrawalMessage; error?: string }> {
    try {
        // Determine RPC URL based on chain ID
        const rpcUrl = l2ChainId === 42161
            ? 'https://arb1.arbitrum.io/rpc'
            : l2ChainId === 421614
            ? 'https://sepolia-rollup.arbitrum.io/rpc'
            : null

        if (!rpcUrl) {
            return { success: false, error: `Unsupported Arbitrum chain ID: ${l2ChainId}` }
        }

        // Fetch transaction receipt
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [txHash],
                id: 1
            })
        })

        const data = await response.json()

        if (data.error) {
            return { success: false, error: data.error.message || 'RPC error' }
        }

        const receipt = data.result

        if (!receipt) {
            return { success: false, error: 'Transaction not found' }
        }

        if (!receipt.blockNumber || receipt.blockNumber === null) {
            return { success: false, error: 'Transaction is still pending' }
        }

        if (!receipt.logs || !Array.isArray(receipt.logs)) {
            return { success: false, error: 'Transaction has no logs' }
        }

        // Look for L2ToL1Tx event
        // Event signature: L2ToL1Tx(address caller, address indexed destination, bytes32 indexed hash, uint256 indexed position, ...)
        const L2ToL1TxTopic = '0x3e7aafa77dbf186b7fd488006beff893744caa3c4f6f299e8a709fa2087374fc'

        const withdrawalLog = receipt.logs.find((log: any) => {
            return log.topics && log.topics[0] === L2ToL1TxTopic
        })

        if (!withdrawalLog) {
            return { success: false, error: 'No L2ToL1Tx event found in transaction logs' }
        }

        // Decode the log
        // Topics: [eventSig, destination, hash, position]
        // Data: [caller, arbBlockNum, ethBlockNum, timestamp, callvalue, data]

        const message: ArbitrumWithdrawalMessage = {
            hash: withdrawalLog.topics[2],
            position: parseInt(withdrawalLog.topics[3], 16),
            arbBlockNum: parseInt(receipt.blockNumber, 16),
            ethBlockNum: 0, // Will be set when challenge period starts
            timestamp: Date.now(),
            callvalue: '0',
            sender: '', // Decode from data
            destination: `0x${withdrawalLog.topics[1].slice(26)}`, // Remove padding
            data: '0x'
        }

        return {
            success: true,
            message
        }

    } catch (error: any) {
        console.error('Error fetching Arbitrum withdrawal message:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch withdrawal message'
        }
    }
}

/**
 * Check if challenge period (7 days) has passed
 */
export async function checkChallengePeriodPassed(
    l2BlockNumber: number,
    l2ChainId: number
): Promise<{ passed: boolean; l2OutputIndex?: number; error?: string }> {
    try {
        const rpcUrl = l2ChainId === 42161
            ? 'https://arb1.arbitrum.io/rpc'
            : 'https://sepolia-rollup.arbitrum.io/rpc'

        // Get current L2 block number
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            })
        })

        const data = await response.json()
        const currentBlock = parseInt(data.result, 16)
        const blocksSinceWithdrawal = currentBlock - l2BlockNumber

        // Arbitrum challenge period: 7 days
        // Assuming ~13 second block time on Arbitrum: 7 days * 24 hours * 60 min * 60 sec / 13 = ~46,523 blocks
        const blocksRequired = 46523

        const passed = blocksSinceWithdrawal >= blocksRequired

        if (passed) {
            return {
                passed: true,
                l2OutputIndex: Math.floor(l2BlockNumber / 1000) // Approximate
            }
        }

        return {
            passed: false,
            error: `Need ${blocksRequired - blocksSinceWithdrawal} more blocks (~${Math.ceil((blocksRequired - blocksSinceWithdrawal) * 13 / 3600)} hours)`
        }

    } catch (error: any) {
        console.error('Error checking challenge period:', error)
        return {
            passed: false,
            error: error.message || 'Failed to check challenge period'
        }
    }
}

/**
 * Get outbox proof data for executing withdrawal on L1
 * Calls the backend service which uses Arbitrum SDK
 */
export async function getOutboxProofData(
    txHash: string,
    l2ChainId: number,
    l1ChainId: number = 1
): Promise<{ success: boolean; proofData?: OutboxProofData; error?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'

        // Call backend to generate proof
        const response = await fetch(`${backendUrl}/api/arbitrum/withdrawal/generate-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash, l2ChainId, l1ChainId })
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
            const isDev = process.env.NODE_ENV !== 'production'
            return {
                success: false,
                error: isDev
                    ? (error.error || 'Failed to generate proof')
                    : 'Unable to generate proof. Please try again later.'
            }
        }

        const data = await response.json()

        if (!data.success || !data.proofData) {
            return {
                success: false,
                error: data.error || 'Invalid response from backend'
            }
        }

        return {
            success: true,
            proofData: data.proofData
        }

    } catch (error: any) {
        console.error('Error fetching outbox proof:', error)
        return {
            success: false,
            error: error.message || 'Failed to fetch outbox proof data'
        }
    }
}

/**
 * Check if withdrawal is ready to execute on L1
 */
export async function isArbitrumWithdrawalReadyToExecute(
    txHash: string,
    l2ChainId: number
): Promise<{ ready: boolean; error?: string }> {
    try {
        // Get withdrawal message
        const messageResult = await getArbitrumWithdrawalMessage(txHash, l2ChainId)

        if (!messageResult.success || !messageResult.message) {
            return { ready: false, error: messageResult.error }
        }

        // Check challenge period
        const challengeResult = await checkChallengePeriodPassed(
            messageResult.message.arbBlockNum,
            l2ChainId
        )

        if (!challengeResult.passed) {
            return { ready: false, error: challengeResult.error }
        }

        return { ready: true }

    } catch (error: any) {
        console.error('Error checking withdrawal readiness:', error)
        return {
            ready: false,
            error: error.message || 'Failed to check withdrawal readiness'
        }
    }
}
