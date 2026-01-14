/**
 * Optimism Withdrawal Service (viem-based)
 *
 * Replaces @eth-optimism/sdk CrossChainMessenger with viem's OP Stack extensions.
 * Supports fault-proof chains (DisputeGameFactory) and legacy L2OutputOracle chains.
 */

import dotenv from 'dotenv'
dotenv.config()

import { createPublicClient, http, defineChain } from 'viem'
import { mainnet, sepolia, optimism, optimismSepolia, base } from 'viem/chains'
import { publicActionsL1, publicActionsL2, getWithdrawals, chainConfig } from 'viem/op-stack'

// ============================================
// Chain Configuration
// ============================================

const L1_CHAINS = {
    1: mainnet,
    11155111: sepolia,
}

// OP Stack L2 chains supported by viem (with portal + dispute game factory addresses)
const L2_CHAINS = {
    10: optimism,
    11155420: optimismSepolia,
    8453: base,
}

// Try to load additional OP Stack chains from viem
try {
    const chains = await import('viem/chains')
    if (chains.ink) L2_CHAINS[57073] = chains.ink
    if (chains.soneium) L2_CHAINS[1868] = chains.soneium
    if (chains.blast) L2_CHAINS[81457] = chains.blast
    if (chains.worldchain) L2_CHAINS[480] = chains.worldchain
} catch {
    console.warn('Could not load additional viem chains')
}

// Fallback: define custom OP Stack chains for any not available in viem
const CUSTOM_CHAIN_CONFIGS = {
    81457: {
        name: 'Blast',
        portalAddress: '0x0Ec68c5B10F21EFFb74f2A5C61DFe6b08C0Db6Cb',
        rpcUrl: 'https://rpc.blast.io',
        l1ChainId: 1,
    },
    57073: {
        name: 'Ink',
        portalAddress: '0xC9c35396E3B77d1Ef250d46c834D15ce6db8dBCd',
        rpcUrl: 'https://rpc-gel.inkonchain.com',
        l1ChainId: 1,
    },
    1868: {
        name: 'Soneium',
        portalAddress: '0x65ea1489741A5D72fFdD4c5a0B5F8fFB4AfAD5d1',
        rpcUrl: 'https://rpc.soneium.org',
        l1ChainId: 1,
    },
    480: {
        name: 'World Chain',
        portalAddress: '0xd5ec14a83B7d95BE1eEc2Cf27bAa79d7f8B9380E',
        rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
        l1ChainId: 1,
    },
}

/**
 * Define a custom OP Stack chain for chains not natively in viem.
 * Note: Custom chains may not support fault proofs unless the dispute game factory
 * address is added to the contracts config.
 */
function defineCustomOpStackChain(chainId) {
    const config = CUSTOM_CHAIN_CONFIGS[chainId]
    if (!config) return null

    return defineChain({
        ...chainConfig,
        id: chainId,
        name: config.name,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: [config.rpcUrl] },
        },
        contracts: {
            ...chainConfig.contracts,
            portal: {
                [config.l1ChainId]: { address: config.portalAddress },
            },
        },
    })
}

// Register custom chains for any not loaded from viem
for (const chainId of Object.keys(CUSTOM_CHAIN_CONFIGS)) {
    const id = Number(chainId)
    if (!L2_CHAINS[id]) {
        const customChain = defineCustomOpStackChain(id)
        if (customChain) {
            L2_CHAINS[id] = customChain
            console.log(`Registered custom OP Stack chain: ${CUSTOM_CHAIN_CONFIGS[id].name} (${id})`)
        }
    }
}

// RPC URL configuration (env vars override defaults)
const L1_RPC_URLS = {
    1: process.env.MAINNET_L1_RPC || 'https://eth.llamarpc.com',
    11155111: process.env.SEPOLIA_L1_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
}

const L2_RPC_URLS = {
    10: process.env.MAINNET_L2_RPC || 'https://mainnet.optimism.io',
    11155420: process.env.SEPOLIA_L2_RPC || 'https://optimism-sepolia-rpc.publicnode.com',
    8453: process.env.BASE_L2_RPC || 'https://mainnet.base.org',
    81457: process.env.BLAST_L2_RPC || 'https://rpc.blast.io',
    57073: process.env.INK_L2_RPC || 'https://rpc-gel.inkonchain.com',
    1868: process.env.SONEIUM_L2_RPC || 'https://rpc.soneium.org',
    480: process.env.WORLDCHAIN_L2_RPC || 'https://worldchain-mainnet.g.alchemy.com/public',
}

// ============================================
// Client Factory
// ============================================

/**
 * Create an L1 public client with OP Stack extensions
 */
function getL1Client(l1ChainId) {
    const chain = L1_CHAINS[l1ChainId]
    if (!chain) {
        throw new Error(`Unsupported L1 chain ID: ${l1ChainId}`)
    }

    return createPublicClient({
        chain,
        transport: http(L1_RPC_URLS[l1ChainId]),
    }).extend(publicActionsL1())
}

/**
 * Create an L2 public client with OP Stack extensions
 */
function getL2Client(l2ChainId) {
    const chain = L2_CHAINS[l2ChainId]
    if (!chain) {
        throw new Error(
            `Unsupported L2 chain ID: ${l2ChainId}. ` +
            `Supported chains: ${Object.keys(L2_CHAINS).join(', ')}`
        )
    }

    return createPublicClient({
        chain,
        transport: http(L2_RPC_URLS[l2ChainId]),
    }).extend(publicActionsL2())
}

// ============================================
// Status Mapping
// ============================================

/**
 * Map viem withdrawal status to the API format expected by the frontend.
 *
 * viem statuses: 'waiting-to-prove', 'ready-to-prove', 'waiting-to-finalize',
 *                'ready-to-finalize', 'finalized'
 *
 * Legacy statuses (from @eth-optimism/sdk MessageStatus enum):
 *   2 = STATE_ROOT_NOT_PUBLISHED
 *   3 = READY_TO_PROVE
 *   4 = IN_CHALLENGE_PERIOD
 *   5 = READY_FOR_RELAY
 *   6 = RELAYED
 */
const VIEM_STATUS_MAP = {
    'waiting-to-prove': {
        status: 'STATE_ROOT_NOT_PUBLISHED',
        statusCode: 2,
        ready: false,
        readyToFinalize: false,
    },
    'ready-to-prove': {
        status: 'READY_TO_PROVE',
        statusCode: 3,
        ready: true,
        readyToFinalize: false,
    },
    'waiting-to-finalize': {
        status: 'IN_CHALLENGE_PERIOD',
        statusCode: 4,
        ready: false,
        readyToFinalize: false,
    },
    'ready-to-finalize': {
        status: 'READY_FOR_RELAY',
        statusCode: 5,
        ready: false,
        readyToFinalize: true,
    },
    'finalized': {
        status: 'RELAYED',
        statusCode: 6,
        ready: false,
        readyToFinalize: false,
    },
}

// ============================================
// API Functions
// ============================================

/**
 * Get withdrawal status using viem's OP Stack getWithdrawalStatus.
 * Works with both fault-proof and legacy L2OutputOracle chains.
 */
export async function getOptimismWithdrawalStatus(txHash, l2ChainId, l1ChainId) {
    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Checking withdrawal status: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        const receipt = await l2Client.getTransactionReceipt({ hash: txHash })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const viemStatus = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain,
        })

        console.log(`[viem] Withdrawal status: ${viemStatus}`)

        const mapped = VIEM_STATUS_MAP[viemStatus]
        if (!mapped) {
            throw new Error(`Unknown withdrawal status: ${viemStatus}`)
        }

        return {
            success: true,
            ...mapped,
        }
    } catch (error) {
        console.error('[viem] Status check error:', error)
        throw new Error(sanitizeError(error))
    }
}

/**
 * Generate withdrawal proof using viem's OP Stack buildProveWithdrawal.
 * Works with both fault-proof and legacy L2OutputOracle chains.
 *
 * Returns proof data in the same format as the old @eth-optimism/sdk response.
 */
export async function generateOptimismProof(txHash, l2ChainId, l1ChainId) {
    let viemStatus = null
    let withdrawal = null

    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Generating proof: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        // 1. Get receipt and extract withdrawal message
        const receipt = await l2Client.getTransactionReceipt({ hash: txHash })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const withdrawals = getWithdrawals(receipt)
        if (!withdrawals || withdrawals.length === 0) {
            throw new Error('No withdrawal message found in transaction')
        }

        withdrawal = withdrawals[0]

        // 2. Check current status
        viemStatus = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain,
        })

        console.log(`[viem] Current status: ${viemStatus}`)

        if (viemStatus === 'waiting-to-prove') {
            const mapped = VIEM_STATUS_MAP[viemStatus]
            throw Object.assign(
                new Error('Withdrawal not ready to prove. State root not yet published.'),
                { statusCode: mapped.statusCode }
            )
        }

        if (viemStatus === 'finalized') {
            throw new Error('Withdrawal already finalized')
        }

        // 3. Build proof data
        // waitToProve returns immediately when the withdrawal is already provable
        const { output } = await l1Client.waitToProve({
            receipt,
            targetChain: l2Chain,
        })

        console.log('[viem] Got L2 output, building prove withdrawal params...')

        const args = await l2Client.buildProveWithdrawal({
            output,
            withdrawal,
        })

        console.log('[viem] Proof built successfully')

        // Serialize to match the existing API response format
        return {
            success: true,
            proofData: serializeProofData(args),
        }
    } catch (error) {
        console.error('[viem] Proof generation error:', error)

        // If proof building fails for already-proven withdrawals,
        // return just the withdrawal struct (sufficient for finalization)
        if (withdrawal && (viemStatus === 'waiting-to-finalize' || viemStatus === 'ready-to-finalize')) {
            console.log('[viem] Returning withdrawal struct only (sufficient for finalization)')

            return {
                success: true,
                proofData: {
                    withdrawalTransaction: {
                        nonce: withdrawal.nonce.toString(),
                        sender: withdrawal.sender,
                        target: withdrawal.target,
                        value: withdrawal.value.toString(),
                        gasLimit: withdrawal.gasLimit.toString(),
                        data: withdrawal.data,
                    },
                    l2OutputIndex: 0,
                    outputRootProof: {
                        version: '0x0000000000000000000000000000000000000000000000000000000000000000',
                        stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
                        messagePasserStorageRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
                        latestBlockhash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    },
                    withdrawalProof: [],
                },
            }
        }

        // Preserve statusCode if set (e.g., for waiting-to-prove)
        const sanitized = new Error(sanitizeError(error))
        if (error.statusCode) sanitized.statusCode = error.statusCode
        throw sanitized
    }
}

/**
 * Get finalization data for a withdrawal.
 * Checks if the withdrawal is ready to finalize.
 */
export async function getOptimismFinalizationData(txHash, l2ChainId, l1ChainId) {
    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Getting finalization data: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        const receipt = await l2Client.getTransactionReceipt({ hash: txHash })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const viemStatus = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain,
        })

        const mapped = VIEM_STATUS_MAP[viemStatus] || {
            status: 'UNKNOWN',
            statusCode: -1,
        }

        return {
            success: true,
            ready: viemStatus === 'ready-to-finalize',
            statusCode: mapped.statusCode,
            message: viemStatus === 'ready-to-finalize'
                ? 'Withdrawal can be finalized'
                : `Withdrawal not ready to finalize. Current status: ${mapped.status}`,
        }
    } catch (error) {
        console.error('[viem] Finalization data error:', error)
        throw new Error(sanitizeError(error))
    }
}

// ============================================
// Helpers
// ============================================

/**
 * Strip URLs from error messages to prevent leaking RPC API keys to the frontend.
 */
function sanitizeError(error) {
    const message = error?.message || error?.shortMessage || 'An unexpected error occurred'
    return message.replace(/https?:\/\/[^\s"')}\]]+/g, '[RPC_URL]')
}

/**
 * Serialize buildProveWithdrawal output to match the existing API response format.
 * Converts BigInt values to strings for JSON serialization.
 */
function serializeProofData(args) {
    return {
        withdrawalTransaction: {
            nonce: args.withdrawal.nonce.toString(),
            sender: args.withdrawal.sender,
            target: args.withdrawal.target,
            value: args.withdrawal.value.toString(),
            gasLimit: args.withdrawal.gasLimit.toString(),
            data: args.withdrawal.data,
        },
        l2OutputIndex: Number(args.l2OutputIndex),
        outputRootProof: {
            version: args.outputRootProof.version,
            stateRoot: args.outputRootProof.stateRoot,
            messagePasserStorageRoot: args.outputRootProof.messagePasserStorageRoot,
            latestBlockhash: args.outputRootProof.latestBlockhash,
        },
        withdrawalProof: args.withdrawalProof,
    }
}

/**
 * Get list of supported L2 chain IDs
 */
export function getSupportedChains() {
    return Object.keys(L2_CHAINS).map(Number)
}
