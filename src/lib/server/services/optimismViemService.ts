/**
 * Optimism Withdrawal Service (viem-based)
 *
 * Supports fault-proof chains (DisputeGameFactory) and legacy L2OutputOracle chains.
 */

import { createPublicClient, http, defineChain, type Chain } from 'viem'
import { mainnet, sepolia, optimism, optimismSepolia, base } from 'viem/chains'
import { publicActionsL1, publicActionsL2, getWithdrawals, chainConfig } from 'viem/op-stack'

// ============================================
// Chain Configuration
// ============================================

const L1_CHAINS: Record<number, Chain> = {
    1: mainnet,
    11155111: sepolia,
}

// OP Stack L2 chains supported by viem
const L2_CHAINS: Record<number, Chain> = {
    10: optimism,
    11155420: optimismSepolia,
    8453: base,
}

// Fallback: define custom OP Stack chains for any not available in viem
const CUSTOM_CHAIN_CONFIGS: Record<number, { name: string; portalAddress: string; rpcUrl: string; l1ChainId: number }> = {
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

function defineCustomOpStackChain(chainId: number): Chain | null {
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
                [config.l1ChainId]: { address: config.portalAddress as `0x${string}` },
            },
        },
    })
}

// Lazy initialization for additional chains (replaces top-level await)
let chainsInitialized = false

async function ensureChainsLoaded(): Promise<void> {
    if (chainsInitialized) return
    chainsInitialized = true

    try {
        const chains = await import('viem/chains') as unknown as Record<string, Chain | undefined>
        if (chains.ink) L2_CHAINS[57073] = chains.ink
        if (chains.soneium) L2_CHAINS[1868] = chains.soneium
        if (chains.blast) L2_CHAINS[81457] = chains.blast
        if (chains.worldchain) L2_CHAINS[480] = chains.worldchain
    } catch {
        console.warn('Could not load additional viem chains')
    }

    // Register custom chains for any not loaded from viem
    for (const chainId of Object.keys(CUSTOM_CHAIN_CONFIGS)) {
        const id = Number(chainId)
        if (!L2_CHAINS[id]) {
            const customChain = defineCustomOpStackChain(id)
            if (customChain) {
                L2_CHAINS[id] = customChain
            }
        }
    }
}

// RPC URL configuration (env vars override defaults)
function getL1RpcUrl(chainId: number): string {
    const urls: Record<number, string> = {
        1: process.env.MAINNET_L1_RPC || 'https://eth.llamarpc.com',
        11155111: process.env.SEPOLIA_L1_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
    }
    return urls[chainId] || ''
}

function getL2RpcUrl(chainId: number): string {
    const urls: Record<number, string> = {
        10: process.env.MAINNET_L2_RPC || 'https://mainnet.optimism.io',
        11155420: process.env.SEPOLIA_L2_RPC || 'https://optimism-sepolia-rpc.publicnode.com',
        8453: process.env.BASE_L2_RPC || 'https://mainnet.base.org',
        81457: process.env.BLAST_L2_RPC || 'https://rpc.blast.io',
        57073: process.env.INK_L2_RPC || 'https://rpc-gel.inkonchain.com',
        1868: process.env.SONEIUM_L2_RPC || 'https://rpc.soneium.org',
        480: process.env.WORLDCHAIN_L2_RPC || 'https://worldchain-mainnet.g.alchemy.com/public',
    }
    return urls[chainId] || ''
}

// ============================================
// Client Factory
// ============================================

function getL1Client(l1ChainId: number) {
    const chain = L1_CHAINS[l1ChainId]
    if (!chain) {
        throw new Error(`Unsupported L1 chain ID: ${l1ChainId}`)
    }

    return createPublicClient({
        chain,
        transport: http(getL1RpcUrl(l1ChainId)),
    }).extend(publicActionsL1())
}

function getL2Client(l2ChainId: number) {
    const chain = L2_CHAINS[l2ChainId]
    if (!chain) {
        throw new Error(
            `Unsupported L2 chain ID: ${l2ChainId}. ` +
            `Supported chains: ${Object.keys(L2_CHAINS).join(', ')}`
        )
    }

    return createPublicClient({
        chain,
        transport: http(getL2RpcUrl(l2ChainId)),
    }).extend(publicActionsL2())
}

// ============================================
// Status Mapping
// ============================================

const VIEM_STATUS_MAP: Record<string, { status: string; statusCode: number; ready: boolean; readyToFinalize: boolean }> = {
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

export async function getOptimismWithdrawalStatus(txHash: string, l2ChainId: number, l1ChainId: number) {
    await ensureChainsLoaded()

    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Checking withdrawal status: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        const receipt = await l2Client.getTransactionReceipt({ hash: txHash as `0x${string}` })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const viemStatus = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain as any,
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
    } catch (error: unknown) {
        console.error('[viem] Status check error:', error)
        throw new Error(sanitizeError(error))
    }
}

export async function generateOptimismProof(txHash: string, l2ChainId: number, l1ChainId: number) {
    await ensureChainsLoaded()

    let viemStatus: string | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let withdrawal: any = null

    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Generating proof: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        const receipt = await l2Client.getTransactionReceipt({ hash: txHash as `0x${string}` })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const withdrawals = getWithdrawals(receipt)
        if (!withdrawals || withdrawals.length === 0) {
            throw new Error('No withdrawal message found in transaction')
        }

        withdrawal = withdrawals[0]

        const status = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain as any,
        })
        viemStatus = status

        console.log(`[viem] Current status: ${viemStatus}`)

        if (viemStatus === 'waiting-to-prove') {
            const mapped = VIEM_STATUS_MAP[viemStatus]
            const err = new Error('Withdrawal not ready to prove. State root not yet published.') as Error & { statusCode?: number }
            err.statusCode = mapped.statusCode
            throw err
        }

        if (viemStatus === 'finalized') {
            throw new Error('Withdrawal already finalized')
        }

        const { output } = await l1Client.waitToProve({
            receipt,
            targetChain: l2Chain as any,
        })

        console.log('[viem] Got L2 output, building prove withdrawal params...')

        const args = await l2Client.buildProveWithdrawal({
            output,
            withdrawal: withdrawal!,
        })

        console.log('[viem] Proof built successfully')

        return {
            success: true,
            proofData: serializeProofData(args),
        }
    } catch (error: unknown) {
        console.error('[viem] Proof generation error:', error)

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

        const sanitized = new Error(sanitizeError(error)) as Error & { statusCode?: number }
        const err = error as Error & { statusCode?: number }
        if (err.statusCode) sanitized.statusCode = err.statusCode
        throw sanitized
    }
}

export async function getOptimismFinalizationData(txHash: string, l2ChainId: number, l1ChainId: number) {
    await ensureChainsLoaded()

    try {
        const l1Client = getL1Client(l1ChainId)
        const l2Client = getL2Client(l2ChainId)
        const l2Chain = L2_CHAINS[l2ChainId]

        console.log(`[viem] Getting finalization data: ${txHash} (L2=${l2ChainId}, L1=${l1ChainId})`)

        const receipt = await l2Client.getTransactionReceipt({ hash: txHash as `0x${string}` })

        if (!receipt) {
            throw new Error('Transaction not found')
        }

        const viemStatus = await l1Client.getWithdrawalStatus({
            receipt,
            targetChain: l2Chain as any,
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
    } catch (error: unknown) {
        console.error('[viem] Finalization data error:', error)
        throw new Error(sanitizeError(error))
    }
}

// ============================================
// Helpers
// ============================================

function sanitizeError(error: unknown): string {
    const err = error as { message?: string; shortMessage?: string }
    const message = err?.message || err?.shortMessage || 'An unexpected error occurred'
    return message.replace(/https?:\/\/[^\s"')}\]]+/g, '[RPC_URL]')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProofData(args: any) {
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

export function getSupportedChains(): number[] {
    return Object.keys(L2_CHAINS).map(Number)
}
