/**
 * Arbitrum Proof Service
 * Handles proof generation and withdrawal tracking for Arbitrum L2→L1 withdrawals
 */

import { ethers } from 'ethers'
import pkg from '@arbitrum/sdk'
const { L2TransactionReceipt, L2ToL1MessageStatus } = pkg

/**
 * Create Arbitrum L2 provider
 */
function createL2Provider(l2ChainId) {
    const rpcUrl = l2ChainId === 42161
        ? process.env.ARBITRUM_L2_RPC || 'https://arb1.arbitrum.io/rpc'
        : l2ChainId === 421614
        ? process.env.ARBITRUM_SEPOLIA_L2_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'
        : null

    if (!rpcUrl) {
        throw new Error(`Unsupported Arbitrum chain ID: ${l2ChainId}`)
    }

    const network = {
        name: l2ChainId === 42161 ? 'arbitrum' : 'arbitrum-sepolia',
        chainId: l2ChainId
    }

    return new ethers.providers.StaticJsonRpcProvider(rpcUrl, network)
}

/**
 * Create Arbitrum L1 provider
 */
function createL1Provider(l1ChainId) {
    const rpcUrl = l1ChainId === 1
        ? process.env.ARBITRUM_L1_RPC || 'https://eth.llamarpc.com'
        : l1ChainId === 11155111
        ? process.env.ARBITRUM_SEPOLIA_L1_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
        : null

    if (!rpcUrl) {
        throw new Error(`Unsupported L1 chain ID: ${l1ChainId}`)
    }

    const network = {
        name: l1ChainId === 1 ? 'homestead' : 'sepolia',
        chainId: l1ChainId
    }

    return new ethers.providers.StaticJsonRpcProvider(rpcUrl, network)
}

/**
 * Get Arbitrum withdrawal message status
 */
export async function getArbitrumWithdrawalStatus(txHash, l2ChainId, l1ChainId) {
    try {
        console.log('📊 Checking Arbitrum withdrawal status:', {
            txHash,
            l2ChainId,
            l1ChainId
        })

        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        // Get transaction receipt
        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return {
                success: false,
                error: 'Transaction not found'
            }
        }

        if (!receipt.blockNumber) {
            return {
                success: false,
                error: 'Transaction is still pending'
            }
        }

        // Create L2TransactionReceipt wrapper
        const l2Receipt = new L2TransactionReceipt(receipt)

        // Get L2 to L1 messages
        const messages = await l2Receipt.getL2ToL1Messages(l1Provider)

        if (!messages || messages.length === 0) {
            return {
                success: false,
                error: 'No L2→L1 messages found in transaction'
            }
        }

        // Get status of the first message
        const message = messages[0]
        const status = await message.status(l2Provider)

        console.log('✅ Arbitrum message status:', {
            messageIndex: message.event.position,
            status,
            l2BlockNumber: receipt.blockNumber,
            l1BatchNumber: message.event.arbBlockNum
        })

        // Map status to readable format
        const statusMap = {
            [L2ToL1MessageStatus.UNCONFIRMED]: 'UNCONFIRMED',
            [L2ToL1MessageStatus.CONFIRMED]: 'CONFIRMED',
            [L2ToL1MessageStatus.EXECUTED]: 'EXECUTED'
        }

        return {
            success: true,
            status: statusMap[status] || 'UNKNOWN',
            statusCode: status,
            ready: status === L2ToL1MessageStatus.CONFIRMED,
            executed: status === L2ToL1MessageStatus.EXECUTED,
            messageIndex: message.event.position.toString(),
            l2BlockNumber: receipt.blockNumber,
            l1BatchNumber: message.event.arbBlockNum?.toString()
        }

    } catch (error) {
        console.error('❌ Error checking Arbitrum withdrawal status:', error)
        return {
            success: false,
            error: error.message || 'Failed to check withdrawal status'
        }
    }
}

/**
 * Get Arbitrum outbox proof data for executing withdrawal on L1
 */
export async function getArbitrumOutboxProof(txHash, l2ChainId, l1ChainId) {
    try {
        console.log('🔐 Generating Arbitrum outbox proof:', {
            txHash,
            l2ChainId,
            l1ChainId
        })

        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        // Get transaction receipt
        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return {
                success: false,
                error: 'Transaction not found'
            }
        }

        // Create L2TransactionReceipt wrapper
        const l2Receipt = new L2TransactionReceipt(receipt)

        // Get L2 to L1 messages
        const messages = await l2Receipt.getL2ToL1Messages(l1Provider)

        if (!messages || messages.length === 0) {
            return {
                success: false,
                error: 'No L2→L1 messages found in transaction'
            }
        }

        const message = messages[0]

        // Check if ready to execute
        const status = await message.status(l2Provider)

        if (status === L2ToL1MessageStatus.EXECUTED) {
            return {
                success: false,
                error: 'Withdrawal already executed'
            }
        }

        if (status !== L2ToL1MessageStatus.CONFIRMED) {
            return {
                success: false,
                error: `Withdrawal not ready. Status: ${status === L2ToL1MessageStatus.UNCONFIRMED ? 'UNCONFIRMED' : 'UNKNOWN'}`,
                statusCode: status
            }
        }

        // Get proof data
        const proof = await message.getOutboxProof(l2Provider)

        console.log('✅ Arbitrum proof generated successfully')

        // Return proof data in format expected by Outbox.executeTransaction()
        return {
            success: true,
            proofData: {
                proof: proof,
                index: message.event.position.toString(),
                l2Sender: message.event.caller,
                to: message.event.destination,
                l2Block: message.event.arbBlockNum.toString(),
                l1Block: message.event.ethBlockNum.toString(),
                l2Timestamp: message.event.timestamp.toString(),
                value: message.event.callvalue.toString(),
                data: message.event.data
            }
        }

    } catch (error) {
        console.error('❌ Error generating Arbitrum proof:', error)
        return {
            success: false,
            error: error.message || 'Failed to generate outbox proof'
        }
    }
}

/**
 * Check if Arbitrum challenge period has passed
 */
export async function checkArbitrumChallengePeriod(txHash, l2ChainId, l1ChainId) {
    try {
        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        // Get transaction receipt
        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return {
                success: false,
                error: 'Transaction not found'
            }
        }

        // Create L2TransactionReceipt wrapper
        const l2Receipt = new L2TransactionReceipt(receipt)

        // Get L2 to L1 messages
        const messages = await l2Receipt.getL2ToL1Messages(l1Provider)

        if (!messages || messages.length === 0) {
            return {
                success: false,
                error: 'No L2→L1 messages found'
            }
        }

        const message = messages[0]
        const status = await message.status(l2Provider)

        // Challenge period is passed if status is CONFIRMED or EXECUTED
        const passed = status === L2ToL1MessageStatus.CONFIRMED || status === L2ToL1MessageStatus.EXECUTED

        // Get current L2 block for time estimation
        const currentBlock = await l2Provider.getBlockNumber()
        const blocksSinceWithdrawal = currentBlock - receipt.blockNumber

        // Arbitrum challenge period: ~7 days = ~46,523 blocks (13 sec block time)
        const blocksRequired = 46523
        const blocksRemaining = Math.max(0, blocksRequired - blocksSinceWithdrawal)

        console.log('⏱️  Arbitrum challenge period check:', {
            currentBlock,
            withdrawalBlock: receipt.blockNumber,
            blocksSince: blocksSinceWithdrawal,
            blocksRequired,
            blocksRemaining,
            passed
        })

        return {
            success: true,
            passed,
            status: passed ? 'CHALLENGE_PERIOD_COMPLETE' : 'IN_CHALLENGE_PERIOD',
            blocksRemaining,
            estimatedTimeRemaining: passed ? 0 : Math.ceil(blocksRemaining * 13 / 3600), // hours
            messageStatus: status
        }

    } catch (error) {
        console.error('❌ Error checking challenge period:', error)
        return {
            success: false,
            error: error.message || 'Failed to check challenge period'
        }
    }
}
