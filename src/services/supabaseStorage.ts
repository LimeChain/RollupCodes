/**
 * Supabase Storage Service
 *
 * Handles database operations for withdrawals using Supabase.
 * This service works alongside localStorage for a hybrid storage approach.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'
import type { StoredWithdrawal, WithdrawalStatus, RollupType } from '../types/withdrawal'

/**
 * Database row type (matches Supabase schema)
 */
interface WithdrawalDbRow {
    id: string
    wallet_address: string
    transaction_hash: string
    rollup_type: string | null
    source_network: string | null
    source_chain_id: number
    destination_network: string | null
    destination_chain_id: number | null
    amount: string
    to_address: string
    contracts: {
        l2BridgeAddress?: string
        l1PortalAddress?: string
        arbSysAddress?: string
        outboxAddress?: string
    } | null
    status: string
    current_step: number
    initiated_at: string | null
    state_root_published_at: string | null
    proven_at: string | null
    challenge_period_ends_at: string | null
    finalized_at: string | null
    prove_tx_hash: string | null
    finalize_tx_hash: string | null
    proof_data: {
        l2OutputIndex?: number
        withdrawalProof?: string[]
    } | null
    error: string | null
    last_error_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Convert StoredWithdrawal to database insert format
 */
function toDbRecord(withdrawal: StoredWithdrawal): Record<string, unknown> {
    return {
        id: withdrawal.id,
        wallet_address: withdrawal.fromAddress?.toLowerCase() || '',
        transaction_hash: withdrawal.transactionHash,
        rollup_type: withdrawal.rollupType || null,
        source_network: withdrawal.sourceNetwork || null,
        source_chain_id: withdrawal.sourceChainId,
        destination_network: withdrawal.destinationNetwork || null,
        destination_chain_id: withdrawal.destinationChainId || withdrawal.targetChainId || null,
        amount: withdrawal.amount,
        to_address: withdrawal.toAddress,
        contracts: {
            l2BridgeAddress: withdrawal.l2BridgeAddress,
            l1PortalAddress: withdrawal.l1PortalAddress,
            arbSysAddress: withdrawal.arbSysAddress,
            outboxAddress: withdrawal.outboxAddress,
        },
        status: withdrawal.status,
        current_step: withdrawal.currentStep,
        initiated_at: withdrawal.initiatedAt ? new Date(withdrawal.initiatedAt).toISOString() : null,
        state_root_published_at: withdrawal.stateRootPublishedAt
            ? new Date(withdrawal.stateRootPublishedAt).toISOString()
            : null,
        proven_at: withdrawal.provenAt ? new Date(withdrawal.provenAt).toISOString() : null,
        challenge_period_ends_at: withdrawal.challengePeriodEndsAt
            ? new Date(withdrawal.challengePeriodEndsAt).toISOString()
            : null,
        finalized_at: withdrawal.finalizedAt ? new Date(withdrawal.finalizedAt).toISOString() : null,
        prove_tx_hash: withdrawal.proveTransactionHash || null,
        finalize_tx_hash: withdrawal.finalizeTransactionHash || withdrawal.finalTransactionHash || null,
        proof_data: withdrawal.withdrawalProof
            ? {
                  l2OutputIndex: withdrawal.l2OutputIndex,
                  withdrawalProof: withdrawal.withdrawalProof,
              }
            : null,
        error: withdrawal.error || null,
        last_error_at: withdrawal.lastErrorAt ? new Date(withdrawal.lastErrorAt).toISOString() : null,
    }
}

/**
 * Convert database row to StoredWithdrawal format
 */
function fromDbRow(row: WithdrawalDbRow): StoredWithdrawal {
    return {
        id: row.id,
        transactionHash: row.transaction_hash,
        rollupType: row.rollup_type as RollupType | undefined,
        sourceNetwork: row.source_network || undefined,
        sourceChainId: row.source_chain_id,
        destinationNetwork: row.destination_network || undefined,
        destinationChainId: row.destination_chain_id || undefined,
        targetChainId: row.destination_chain_id || undefined,
        amount: row.amount,
        fromAddress: row.wallet_address,
        toAddress: row.to_address,
        l2BridgeAddress: row.contracts?.l2BridgeAddress,
        l1PortalAddress: row.contracts?.l1PortalAddress,
        arbSysAddress: row.contracts?.arbSysAddress,
        outboxAddress: row.contracts?.outboxAddress,
        status: row.status as WithdrawalStatus,
        currentStep: row.current_step,
        initiatedAt: row.initiated_at ? new Date(row.initiated_at).getTime() : undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
        stateRootPublishedAt: row.state_root_published_at
            ? new Date(row.state_root_published_at).getTime()
            : undefined,
        provenAt: row.proven_at ? new Date(row.proven_at).getTime() : undefined,
        challengePeriodEndsAt: row.challenge_period_ends_at
            ? new Date(row.challenge_period_ends_at).getTime()
            : undefined,
        finalizedAt: row.finalized_at ? new Date(row.finalized_at).getTime() : undefined,
        proveTransactionHash: row.prove_tx_hash || undefined,
        finalizeTransactionHash: row.finalize_tx_hash || undefined,
        finalTransactionHash: row.finalize_tx_hash || undefined,
        l2OutputIndex: row.proof_data?.l2OutputIndex,
        withdrawalProof: row.proof_data?.withdrawalProof,
        error: row.error || undefined,
        lastErrorAt: row.last_error_at ? new Date(row.last_error_at).getTime() : undefined,
    }
}

/**
 * Save a withdrawal to Supabase
 */
export async function saveWithdrawalToSupabase(withdrawal: StoredWithdrawal): Promise<boolean> {
    const client = getSupabaseClient()
    if (!client) return false

    try {
        const record = toDbRecord(withdrawal)

        const { error } = await client.from('withdrawals').upsert(record, {
            onConflict: 'transaction_hash',
        })

        if (error) {
            console.error('[Supabase] Error saving withdrawal:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[Supabase] Exception saving withdrawal:', error)
        return false
    }
}

/**
 * Get all withdrawals for a wallet address from Supabase
 */
export async function getWithdrawalsFromSupabase(
    walletAddress: string
): Promise<StoredWithdrawal[]> {
    const client = getSupabaseClient()
    if (!client) return []

    try {
        const { data, error } = await client
            .from('withdrawals')
            .select('*')
            .eq('wallet_address', walletAddress.toLowerCase())
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Supabase] Error fetching withdrawals:', error)
            return []
        }

        return (data || []).map((row) => fromDbRow(row as WithdrawalDbRow))
    } catch (error) {
        console.error('[Supabase] Exception fetching withdrawals:', error)
        return []
    }
}

/**
 * Get a specific withdrawal by transaction hash from Supabase
 */
export async function getWithdrawalByTxHashFromSupabase(
    txHash: string
): Promise<StoredWithdrawal | null> {
    const client = getSupabaseClient()
    if (!client) return null

    try {
        const { data, error } = await client
            .from('withdrawals')
            .select('*')
            .eq('transaction_hash', txHash)
            .single()

        if (error) {
            if (error.code !== 'PGRST116') {
                // Not "no rows returned"
                console.error('[Supabase] Error fetching withdrawal:', error)
            }
            return null
        }

        return data ? fromDbRow(data as WithdrawalDbRow) : null
    } catch (error) {
        console.error('[Supabase] Exception fetching withdrawal:', error)
        return null
    }
}

/**
 * Update withdrawal status in Supabase
 */
export async function updateWithdrawalStatusInSupabase(
    id: string,
    status: WithdrawalStatus,
    updates?: Partial<StoredWithdrawal>
): Promise<boolean> {
    const client = getSupabaseClient()
    if (!client) return false

    try {
        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        }

        if (updates) {
            if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep
            if (updates.stateRootPublishedAt !== undefined) {
                updateData.state_root_published_at = new Date(updates.stateRootPublishedAt).toISOString()
            }
            if (updates.provenAt !== undefined) {
                updateData.proven_at = new Date(updates.provenAt).toISOString()
            }
            if (updates.challengePeriodEndsAt !== undefined) {
                updateData.challenge_period_ends_at = new Date(updates.challengePeriodEndsAt).toISOString()
            }
            if (updates.finalizedAt !== undefined) {
                updateData.finalized_at = new Date(updates.finalizedAt).toISOString()
            }
            if (updates.proveTransactionHash !== undefined) {
                updateData.prove_tx_hash = updates.proveTransactionHash
            }
            if (updates.finalizeTransactionHash !== undefined) {
                updateData.finalize_tx_hash = updates.finalizeTransactionHash
            }
            if (updates.error !== undefined) {
                updateData.error = updates.error
                updateData.last_error_at = new Date().toISOString()
            }
        }

        const { error } = await client.from('withdrawals').update(updateData).eq('id', id)

        if (error) {
            console.error('[Supabase] Error updating withdrawal:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[Supabase] Exception updating withdrawal:', error)
        return false
    }
}

/**
 * Delete a withdrawal from Supabase
 */
export async function deleteWithdrawalFromSupabase(id: string): Promise<boolean> {
    const client = getSupabaseClient()
    if (!client) return false

    try {
        const { error } = await client.from('withdrawals').delete().eq('id', id)

        if (error) {
            console.error('[Supabase] Error deleting withdrawal:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[Supabase] Exception deleting withdrawal:', error)
        return false
    }
}

/**
 * Sync local withdrawals to Supabase (for migration)
 */
export async function syncLocalToSupabase(withdrawals: StoredWithdrawal[]): Promise<number> {
    const client = getSupabaseClient()
    if (!client) return 0

    let synced = 0

    for (const withdrawal of withdrawals) {
        const success = await saveWithdrawalToSupabase(withdrawal)
        if (success) synced++
    }

    return synced
}

/**
 * Merge local and remote withdrawals, preferring newer data
 */
export function mergeWithdrawals(
    local: StoredWithdrawal[],
    remote: StoredWithdrawal[]
): StoredWithdrawal[] {
    const merged = new Map<string, StoredWithdrawal>()

    // Add all remote withdrawals first
    for (const w of remote) {
        merged.set(w.transactionHash, w)
    }

    // Merge local withdrawals, preferring newer updates
    for (const localW of local) {
        const remoteW = merged.get(localW.transactionHash)

        if (!remoteW) {
            // Only exists locally
            merged.set(localW.transactionHash, localW)
        } else {
            // Exists in both - compare timestamps and status
            const localTime = localW.initiatedAt || localW.createdAt || 0
            const remoteTime = remoteW.initiatedAt || remoteW.createdAt || 0

            // Prefer the one with higher currentStep or more recent update
            if (localW.currentStep > remoteW.currentStep) {
                merged.set(localW.transactionHash, localW)
            } else if (localW.currentStep === remoteW.currentStep && localTime > remoteTime) {
                merged.set(localW.transactionHash, localW)
            }
            // Otherwise keep remote (already in map)
        }
    }

    // Sort by initiated time, newest first
    return Array.from(merged.values()).sort((a, b) => {
        const timeA = a.initiatedAt || a.createdAt || 0
        const timeB = b.initiatedAt || b.createdAt || 0
        return timeB - timeA
    })
}

/**
 * Check if Supabase is available and configured
 */
export function isSupabaseAvailable(): boolean {
    return isSupabaseConfigured()
}
