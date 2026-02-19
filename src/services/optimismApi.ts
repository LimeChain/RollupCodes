/**
 * Optimism API Service
 * Handles withdrawal status checking via RPC
 */

export interface OptimismWithdrawalMessage {
    messageHash: string
    transactionHash: string
    blockNumber: number
    logIndex: number
    l1Token: string
    l2Token: string
    from: string
    to: string
    amount: string
    extraData: string
}

/**
 * Get withdrawal message from L2 transaction receipt
 */
export async function getWithdrawalMessage(
    txHash: string,
    l2ChainId: number
): Promise<{ success: boolean; message?: OptimismWithdrawalMessage; error?: string }> {
    try {
        const rpcUrl = l2ChainId === 11155420
            ? 'https://sepolia.optimism.io'
            : 'https://mainnet.optimism.io'

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

        if (!response.ok) {
            return { success: false, error: 'Failed to fetch transaction receipt' }
        }

        const data = await response.json()

        if (data.error) {
            return { success: false, error: data.error.message || 'RPC error' }
        }

        if (!data.result) {
            return { success: false, error: 'Transaction not found' }
        }

        const receipt = data.result

        if (!receipt.blockNumber || receipt.blockNumber === null || receipt.blockNumber === '0x0') {
            return {
                success: false,
                error: 'Transaction is still pending confirmation.'
            }
        }

        if (!receipt.logs || receipt.logs.length === 0) {
            return {
                success: false,
                error: 'Transaction has no event logs.'
            }
        }

        // Find WithdrawalInitiated event
        const withdrawalEvent = receipt.logs.find((log: any) =>
            log.topics && log.topics[0] === '0x73d170910aba9e6d50b102db522b1dbcd796216f5128b445aa2135272886497e'
        )

        if (!withdrawalEvent) {
            return {
                success: false,
                error: 'No withdrawal event found in transaction.'
            }
        }

        const message: OptimismWithdrawalMessage = {
            messageHash: withdrawalEvent.topics[1] || '',
            transactionHash: txHash,
            blockNumber: parseInt(receipt.blockNumber, 16),
            logIndex: parseInt(withdrawalEvent.logIndex || '0x0', 16),
            l1Token: withdrawalEvent.topics[1] ? '0x' + withdrawalEvent.topics[1].slice(26) : '0x0000000000000000000000000000000000000000',
            l2Token: withdrawalEvent.topics[2] ? '0x' + withdrawalEvent.topics[2].slice(26) : '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
            from: withdrawalEvent.topics[3] ? '0x' + withdrawalEvent.topics[3].slice(26) : '',
            to: '',
            amount: withdrawalEvent.data || '0x0',
            extraData: '0x'
        }

        return { success: true, message }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to get withdrawal message'
        }
    }
}

// L1 RPC URLs for querying L1 contracts
const L1_RPC_URLS: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    11155111: 'https://rpc.sepolia.org',
}

// Function selectors for contract calls
const SELECTORS = {
    // OptimismPortal.l2Oracle() → returns L2OutputOracle address
    l2Oracle: '0x9b5f694a',
    // L2OutputOracle.latestBlockNumber() → returns latest proposed L2 block
    latestBlockNumber: '0x4599c788',
}

/**
 * Make an eth_call to an L1 contract
 */
async function ethCallL1(
    l1RpcUrl: string,
    to: string,
    data: string
): Promise<string | null> {
    try {
        const response = await fetch(l1RpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{ to, data }, 'latest'],
                id: 1,
            }),
        })

        if (!response.ok) return null

        const result = await response.json()
        if (result.error || !result.result || result.result === '0x') return null

        return result.result
    } catch {
        return null
    }
}

/**
 * Check if state root has been published for a given L2 block.
 * Queries the L2OutputOracle on L1 (derived from OptimismPortal) to check
 * if an output root covering the withdrawal's L2 block has been proposed.
 * Falls back to L2 block counting heuristic if L1 query fails.
 */
export async function checkStateRootPublished(
    l2BlockNumber: number,
    l2ChainId: number,
    l1ChainId?: number,
    l1PortalAddress?: string
): Promise<{ published: boolean; l2OutputIndex?: number; latestProposedBlock?: number; error?: string }> {
    // Try L1 RPC query first if we have the necessary info
    if (l1ChainId && l1PortalAddress) {
        const l1RpcUrl = L1_RPC_URLS[l1ChainId]
        if (l1RpcUrl) {
            const l1Result = await checkStateRootViaL1(l1RpcUrl, l1PortalAddress, l2BlockNumber)
            if (l1Result !== null) {
                return l1Result
            }
        }
    }

    // Fallback: L2 block counting heuristic
    return checkStateRootViaBlockCounting(l2BlockNumber, l2ChainId)
}

/**
 * Query L2OutputOracle on L1 to check state root publication.
 * Returns null if the query fails (caller should use fallback).
 */
async function checkStateRootViaL1(
    l1RpcUrl: string,
    portalAddress: string,
    l2BlockNumber: number
): Promise<{ published: boolean; l2OutputIndex?: number; latestProposedBlock?: number; error?: string } | null> {
    try {
        // Step 1: Get L2OutputOracle address from OptimismPortal
        const oracleResult = await ethCallL1(l1RpcUrl, portalAddress, SELECTORS.l2Oracle)
        if (!oracleResult) return null

        // Decode address from 32-byte ABI-encoded response
        const l2OracleAddress = '0x' + oracleResult.slice(26)

        // Validate it's not the zero address (fault proof chains return 0x0)
        if (l2OracleAddress === '0x0000000000000000000000000000000000000000') {
            return null
        }

        // Step 2: Query L2OutputOracle.latestBlockNumber()
        const latestBlockResult = await ethCallL1(l1RpcUrl, l2OracleAddress, SELECTORS.latestBlockNumber)
        if (!latestBlockResult) return null

        const latestProposedBlock = parseInt(latestBlockResult, 16)
        if (isNaN(latestProposedBlock) || latestProposedBlock === 0) return null

        const published = l2BlockNumber <= latestProposedBlock

        if (published) {
            return {
                published: true,
                latestProposedBlock,
                l2OutputIndex: Math.floor(l2BlockNumber / 120),
            }
        }

        const blocksRemaining = l2BlockNumber - latestProposedBlock
        // OP Stack proposes outputs roughly every 1800 L2 blocks (~1 hour)
        const minutesRemaining = Math.ceil((blocksRemaining / 1800) * 60)

        return {
            published: false,
            latestProposedBlock,
            error: `State root not yet published. L2 block ${l2BlockNumber} needs to be proposed (latest: ${latestProposedBlock}). ~${minutesRemaining} min remaining.`,
        }
    } catch {
        return null
    }
}

/**
 * Fallback: estimate state root publication using L2 block counting.
 */
async function checkStateRootViaBlockCounting(
    l2BlockNumber: number,
    l2ChainId: number
): Promise<{ published: boolean; l2OutputIndex?: number; error?: string }> {
    try {
        const rpcUrl = l2ChainId === 11155420
            ? 'https://sepolia.optimism.io'
            : 'https://mainnet.optimism.io'

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
            }),
        })

        const data = await response.json()
        const currentBlock = parseInt(data.result, 16)
        const blocksSinceWithdrawal = currentBlock - l2BlockNumber

        // On OP Stack, blocks are ~2 seconds apart
        // State roots published every ~1800 blocks (1 hour)
        // Require at least 2000 blocks to be safe
        const blocksRequired = 2000
        const published = blocksSinceWithdrawal >= blocksRequired

        if (published) {
            return {
                published: true,
                l2OutputIndex: Math.floor(l2BlockNumber / 120),
            }
        }

        const blocksRemaining = blocksRequired - blocksSinceWithdrawal
        const minutesRemaining = Math.ceil((blocksRemaining * 2) / 60)

        return {
            published: false,
            error: `State root not yet published. ~${minutesRemaining} minutes remaining.`,
        }
    } catch (error: any) {
        return {
            published: false,
            error: error.message || 'Failed to check state root',
        }
    }
}
