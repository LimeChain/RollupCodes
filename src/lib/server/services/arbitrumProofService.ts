/**
 * Arbitrum Proof Service
 * Handles proof generation and withdrawal tracking for Arbitrum L2->L1 withdrawals
 *
 * Uses ethers v5 (via npm alias "ethers5") because @arbitrum/sdk requires it.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ethers } = require('ethers5')
import pkg from '@arbitrum/sdk'
const { ChildTransactionReceipt, ChildToParentMessageStatus } = pkg

function createL2Provider(l2ChainId: number) {
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

function createL1Provider(l1ChainId: number) {
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

export async function getArbitrumWithdrawalStatus(txHash: string, l2ChainId: number, l1ChainId: number) {
    try {
        console.log('[arbitrum] Checking withdrawal status:', { txHash, l2ChainId, l1ChainId })

        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return { success: false, error: 'Transaction not found' }
        }

        if (!receipt.blockNumber) {
            return { success: false, error: 'Transaction is still pending' }
        }

        const l2Receipt = new ChildTransactionReceipt(receipt)
        const events = l2Receipt.getChildToParentEvents()
        const messages = await l2Receipt.getChildToParentMessages(l1Provider)

        if (!messages || messages.length === 0) {
            return { success: false, error: 'No withdrawal messages found in transaction' }
        }

        const message = messages[0]
        const event = events[0] as any
        const status = await message.status(l2Provider)

        const statusMap: Record<number, string> = {
            [ChildToParentMessageStatus.UNCONFIRMED]: 'UNCONFIRMED',
            [ChildToParentMessageStatus.CONFIRMED]: 'CONFIRMED',
            [ChildToParentMessageStatus.EXECUTED]: 'EXECUTED'
        }

        return {
            success: true,
            status: statusMap[status] || 'UNKNOWN',
            statusCode: status,
            ready: status === ChildToParentMessageStatus.CONFIRMED,
            executed: status === ChildToParentMessageStatus.EXECUTED,
            messageIndex: event?.position?.toString(),
            l2BlockNumber: receipt.blockNumber,
            l1BatchNumber: event?.arbBlockNum?.toString()
        }

    } catch (error: unknown) {
        console.error('[arbitrum] Error checking withdrawal status:', error)
        const err = error as Error
        return {
            success: false,
            error: err.message || 'Failed to check withdrawal status'
        }
    }
}

export async function getArbitrumOutboxProof(txHash: string, l2ChainId: number, l1ChainId: number) {
    try {
        console.log('[arbitrum] Generating outbox proof:', { txHash, l2ChainId, l1ChainId })

        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return { success: false, error: 'Transaction not found' }
        }

        const l2Receipt = new ChildTransactionReceipt(receipt)
        const events = l2Receipt.getChildToParentEvents()
        const messages = await l2Receipt.getChildToParentMessages(l1Provider)

        if (!messages || messages.length === 0) {
            return { success: false, error: 'No withdrawal messages found in transaction' }
        }

        const message = messages[0]
        const event = events[0] as any
        const status = await message.status(l2Provider)

        if (status === ChildToParentMessageStatus.EXECUTED) {
            return { success: false, error: 'Withdrawal already executed' }
        }

        if (status !== ChildToParentMessageStatus.CONFIRMED) {
            return {
                success: false,
                error: `Withdrawal not ready. Status: ${status === ChildToParentMessageStatus.UNCONFIRMED ? 'UNCONFIRMED' : 'UNKNOWN'}`,
                statusCode: status
            }
        }

        const proof = await message.getOutboxProof(l2Provider)

        console.log('[arbitrum] Proof generated successfully')

        return {
            success: true,
            proofData: {
                proof: proof,
                index: event?.position?.toString(),
                l2Sender: event?.caller,
                to: event?.destination,
                l2Block: event?.arbBlockNum?.toString(),
                l1Block: event?.ethBlockNum?.toString(),
                l2Timestamp: event?.timestamp?.toString(),
                value: event?.callvalue?.toString(),
                data: event?.data
            }
        }

    } catch (error: unknown) {
        console.error('[arbitrum] Error generating proof:', error)
        const err = error as Error
        return {
            success: false,
            error: err.message || 'Failed to generate outbox proof'
        }
    }
}

export async function checkArbitrumChallengePeriod(txHash: string, l2ChainId: number, l1ChainId: number) {
    try {
        const l2Provider = createL2Provider(l2ChainId)
        const l1Provider = createL1Provider(l1ChainId)

        const receipt = await l2Provider.getTransactionReceipt(txHash)

        if (!receipt) {
            return { success: false, error: 'Transaction not found' }
        }

        const l2Receipt = new ChildTransactionReceipt(receipt)
        const messages = await l2Receipt.getChildToParentMessages(l1Provider)

        if (!messages || messages.length === 0) {
            return { success: false, error: 'No withdrawal messages found' }
        }

        const message = messages[0]
        const status = await message.status(l2Provider)

        const passed = status === ChildToParentMessageStatus.CONFIRMED || status === ChildToParentMessageStatus.EXECUTED

        const currentBlock = await l2Provider.getBlockNumber()
        const blocksSinceWithdrawal = currentBlock - receipt.blockNumber

        // Arbitrum challenge period: ~7 days = ~46,523 blocks (13 sec block time)
        const blocksRequired = 46523
        const blocksRemaining = Math.max(0, blocksRequired - blocksSinceWithdrawal)

        return {
            success: true,
            passed,
            status: passed ? 'CHALLENGE_PERIOD_COMPLETE' : 'IN_CHALLENGE_PERIOD',
            blocksRemaining,
            estimatedTimeRemaining: passed ? 0 : Math.ceil(blocksRemaining * 13 / 3600),
            messageStatus: status
        }

    } catch (error: unknown) {
        console.error('[arbitrum] Error checking challenge period:', error)
        const err = error as Error
        return {
            success: false,
            error: err.message || 'Failed to check challenge period'
        }
    }
}
