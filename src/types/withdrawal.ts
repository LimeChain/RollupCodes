export type RollupType = 'optimism' | 'arbitrum' | 'base' | 'other'

export type WithdrawalStatus =
    // Optimism statuses
    | 'initiated'
    | 'waiting_state_root'
    | 'ready_to_prove'
    | 'proven'
    | 'waiting_challenge'
    | 'ready_to_finalize'
    | 'finalized'
    | 'failed'
    // Arbitrum statuses
    | 'ready_to_execute'
    | 'executing'
    | 'completed'

export interface StoredWithdrawal {
    // Identification
    id: string // Unique ID for this withdrawal
    transactionHash: string // L2 transaction hash from initiation
    rollupType?: RollupType // Type of rollup (optimism, arbitrum, etc.)

    // Network info
    sourceNetwork?: string // e.g., "optimism-sepolia"
    sourceChainId: number
    destinationNetwork?: string // e.g., "Sepolia"
    destinationChainId?: number
    targetChainId?: number // Alias for destinationChainId

    // Transaction details
    amount: string // Amount in ETH
    fromAddress?: string // User's address
    toAddress: string // Recipient address on L1

    // Contract info (Optimism/OP Stack)
    l2BridgeAddress?: string
    l1PortalAddress?: string

    // Contract info (Arbitrum)
    arbSysAddress?: string
    outboxAddress?: string

    // Status tracking
    status: WithdrawalStatus
    currentStep: number // 1-5 based on withdrawal_flow.steps

    // Timestamps
    initiatedAt?: number // Unix timestamp when withdrawal was initiated
    createdAt?: number // Alias for initiatedAt
    stateRootPublishedAt?: number // When state root was published to L1 (Optimism)
    provenAt?: number // When proof was submitted (Optimism)
    challengePeriodEndsAt?: number // When challenge period ends
    challengePassedAt?: number // When challenge period passed (Arbitrum)
    finalizedAt?: number // When withdrawal was finalized (Optimism)
    completedAt?: number // When withdrawal was completed (Arbitrum)

    // Proof data (for step 3)
    l2OutputIndex?: number
    withdrawalProof?: string[] // Merkle proof data (array of hex strings)

    // Transaction hashes for each step
    proveTransactionHash?: string // L1 transaction for proving (Optimism)
    finalizeTransactionHash?: string // L1 transaction for finalization (Optimism)
    finalTransactionHash?: string // Final L1 transaction hash (Arbitrum)

    // Error tracking
    error?: string
    lastErrorAt?: number
}

export interface WithdrawalStepInfo {
    stepNumber: number
    stepId: string
    name: string
    description: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    canExecute: boolean
    transactionHash?: string
    timestamp?: number
}
