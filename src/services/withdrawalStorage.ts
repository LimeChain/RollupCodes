/**
 * Withdrawal Storage Service
 *
 * Handles localStorage operations for withdrawals.
 * This is the primary storage (fast, offline-capable).
 * Supabase sync is handled by the useWithdrawals hook or supabaseStorage service.
 */

import { StoredWithdrawal, WithdrawalStatus } from '../types/withdrawal'
import {
    saveWithdrawalToSupabase,
    updateWithdrawalStatusInSupabase,
    deleteWithdrawalFromSupabase,
    isSupabaseAvailable,
} from './supabaseStorage'

const STORAGE_KEY = 'rollup_codes_withdrawals'

/**
 * Get all stored withdrawals from localStorage
 */
export function getAllWithdrawals(): StoredWithdrawal[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return []
        return JSON.parse(stored) as StoredWithdrawal[]
    } catch (error) {
        console.error('Error reading withdrawals from storage:', error)
        return []
    }
}

/**
 * Get withdrawals for a specific address
 */
export function getWithdrawalsByAddress(address: string): StoredWithdrawal[] {
    return getAllWithdrawals().filter(
        w => w.fromAddress?.toLowerCase() === address.toLowerCase()
    )
}

/**
 * Get a specific withdrawal by ID
 */
export function getWithdrawalById(id: string): StoredWithdrawal | null {
    const withdrawals = getAllWithdrawals()
    return withdrawals.find(w => w.id === id) || null
}

/**
 * Get a specific withdrawal by transaction hash
 */
export function getWithdrawalByTxHash(txHash: string): StoredWithdrawal | null {
    const withdrawals = getAllWithdrawals()
    return withdrawals.find(w => w.transactionHash === txHash) || null
}

/**
 * Save a new withdrawal to localStorage
 * Also syncs to Supabase in background if available
 */
export function saveWithdrawal(withdrawal: StoredWithdrawal): boolean {
    if (typeof window === 'undefined') return false

    try {
        const withdrawals = getAllWithdrawals()

        // Check if withdrawal already exists
        const existingIndex = withdrawals.findIndex(w => w.id === withdrawal.id)

        if (existingIndex >= 0) {
            // Update existing
            withdrawals[existingIndex] = withdrawal
        } else {
            // Add new
            withdrawals.push(withdrawal)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(withdrawals))

        // Sync to Supabase in background (non-blocking)
        if (isSupabaseAvailable()) {
            saveWithdrawalToSupabase(withdrawal).catch(err => {
                console.warn('[withdrawalStorage] Failed to sync to Supabase:', err)
            })
        }

        return true
    } catch (error) {
        console.error('Error saving withdrawal:', error)
        return false
    }
}

/**
 * Update withdrawal status in localStorage
 * Also syncs to Supabase in background if available
 */
export function updateWithdrawalStatus(
    id: string,
    status: WithdrawalStatus,
    updates?: Partial<StoredWithdrawal>
): boolean {
    const withdrawal = getWithdrawalById(id)
    if (!withdrawal) return false

    const updatedWithdrawal: StoredWithdrawal = {
        ...withdrawal,
        status,
        ...updates
    }

    const success = saveWithdrawalLocal(updatedWithdrawal)

    // Sync status update to Supabase in background
    if (success && isSupabaseAvailable()) {
        updateWithdrawalStatusInSupabase(id, status, updates).catch(err => {
            console.warn('[withdrawalStorage] Failed to sync status to Supabase:', err)
        })
    }

    return success
}

/**
 * Save withdrawal to localStorage only (no Supabase sync)
 * Used internally to avoid recursive sync
 */
function saveWithdrawalLocal(withdrawal: StoredWithdrawal): boolean {
    if (typeof window === 'undefined') return false

    try {
        const withdrawals = getAllWithdrawals()
        const existingIndex = withdrawals.findIndex(w => w.id === withdrawal.id)

        if (existingIndex >= 0) {
            withdrawals[existingIndex] = withdrawal
        } else {
            withdrawals.push(withdrawal)
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(withdrawals))
        return true
    } catch (error) {
        console.error('Error saving withdrawal locally:', error)
        return false
    }
}

/**
 * Delete a withdrawal from localStorage
 * Also deletes from Supabase in background if available
 */
export function deleteWithdrawal(id: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        const withdrawals = getAllWithdrawals()
        const filtered = withdrawals.filter(w => w.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

        // Sync deletion to Supabase in background
        if (isSupabaseAvailable()) {
            deleteWithdrawalFromSupabase(id).catch(err => {
                console.warn('[withdrawalStorage] Failed to delete from Supabase:', err)
            })
        }

        return true
    } catch (error) {
        console.error('Error deleting withdrawal:', error)
        return false
    }
}

/**
 * Get pending withdrawals (not finalized or failed)
 */
export function getPendingWithdrawals(address?: string): StoredWithdrawal[] {
    let withdrawals = getAllWithdrawals()

    if (address) {
        withdrawals = withdrawals.filter(
            w => w.fromAddress?.toLowerCase() === address.toLowerCase()
        )
    }

    return withdrawals.filter(
        w => w.status !== 'finalized' && w.status !== 'completed' && w.status !== 'failed'
    )
}

/**
 * Check if withdrawal challenge period has ended
 */
export function isChallengePeriodComplete(withdrawal: StoredWithdrawal): boolean {
    if (!withdrawal.challengePeriodEndsAt) return false
    return Date.now() >= withdrawal.challengePeriodEndsAt
}

/**
 * Calculate time remaining in challenge period
 */
export function getChallengeTimeRemaining(withdrawal: StoredWithdrawal): string {
    if (!withdrawal.challengePeriodEndsAt) return 'Unknown'

    const now = Date.now()
    const remaining = withdrawal.challengePeriodEndsAt - now

    if (remaining <= 0) return 'Complete'

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
        return `${days}d ${hours}h`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

/**
 * Generate a unique ID for a withdrawal
 */
export function generateWithdrawalId(txHash: string, address: string): string {
    return `${txHash.slice(0, 10)}_${address.slice(0, 10)}_${Date.now()}`
}

/**
 * Clear all withdrawals from localStorage (for testing/debugging)
 */
export function clearAllWithdrawals(): boolean {
    if (typeof window === 'undefined') return false

    try {
        localStorage.removeItem(STORAGE_KEY)
        return true
    } catch (error) {
        console.error('Error clearing withdrawals:', error)
        return false
    }
}
