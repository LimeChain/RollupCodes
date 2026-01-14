/**
 * useWithdrawals Hook
 *
 * React hook for managing withdrawal data with hybrid storage.
 * Uses localStorage as primary (fast, offline) with Supabase as backup/sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { StoredWithdrawal, WithdrawalStatus } from '../types/withdrawal'
import {
    getAllWithdrawals as getLocalWithdrawals,
    saveWithdrawal as saveLocalWithdrawal,
    updateWithdrawalStatus as updateLocalStatus,
    deleteWithdrawal as deleteLocalWithdrawal,
    generateWithdrawalId,
} from '../services/withdrawalStorage'
import {
    saveWithdrawalToSupabase,
    getWithdrawalsFromSupabase,
    updateWithdrawalStatusInSupabase,
    deleteWithdrawalFromSupabase,
    mergeWithdrawals,
    isSupabaseAvailable,
    syncLocalToSupabase,
} from '../services/supabaseStorage'

interface UseWithdrawalsOptions {
    walletAddress?: string | null
    autoSync?: boolean
    syncInterval?: number // milliseconds
}

interface UseWithdrawalsReturn {
    withdrawals: StoredWithdrawal[]
    isLoading: boolean
    isSyncing: boolean
    error: string | null
    isSupabaseEnabled: boolean
    // Actions
    saveWithdrawal: (withdrawal: StoredWithdrawal) => Promise<boolean>
    updateStatus: (
        id: string,
        status: WithdrawalStatus,
        updates?: Partial<StoredWithdrawal>
    ) => Promise<boolean>
    deleteWithdrawal: (id: string) => Promise<boolean>
    refresh: () => Promise<void>
    syncToCloud: () => Promise<number>
}

export function useWithdrawals(options: UseWithdrawalsOptions = {}): UseWithdrawalsReturn {
    const { walletAddress, autoSync = true, syncInterval = 30000 } = options

    const [withdrawals, setWithdrawals] = useState<StoredWithdrawal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastSyncRef = useRef<number>(0)

    // Check if Supabase is available
    const isSupabaseEnabled = isSupabaseAvailable()

    /**
     * Load withdrawals from localStorage and optionally sync with Supabase
     */
    const loadWithdrawals = useCallback(async () => {
        try {
            // 1. Load from localStorage first (instant)
            let localWithdrawals = getLocalWithdrawals()

            // Filter by wallet address if provided
            if (walletAddress) {
                localWithdrawals = localWithdrawals.filter(
                    (w) => w.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
                )
            }

            // Set local data immediately for fast UX
            setWithdrawals(localWithdrawals)
            setIsLoading(false)

            // 2. If Supabase is enabled, sync in background
            if (isSupabaseEnabled && walletAddress) {
                setIsSyncing(true)

                try {
                    const remoteWithdrawals = await getWithdrawalsFromSupabase(walletAddress)

                    // Merge local and remote data
                    const merged = mergeWithdrawals(localWithdrawals, remoteWithdrawals)
                    setWithdrawals(merged)

                    // Update localStorage with merged data
                    for (const w of merged) {
                        saveLocalWithdrawal(w)
                    }

                    lastSyncRef.current = Date.now()
                } catch (syncError) {
                    console.warn('[useWithdrawals] Supabase sync failed:', syncError)
                    // Continue with local data - don't fail
                } finally {
                    setIsSyncing(false)
                }
            }
        } catch (err: any) {
            console.error('[useWithdrawals] Error loading withdrawals:', err)
            setError(err.message || 'Failed to load withdrawals')
            setIsLoading(false)
        }
    }, [walletAddress, isSupabaseEnabled])

    /**
     * Save a withdrawal to both localStorage and Supabase
     */
    const saveWithdrawal = useCallback(
        async (withdrawal: StoredWithdrawal): Promise<boolean> => {
            try {
                // 1. Save to localStorage first (fast, guaranteed)
                const localSuccess = saveLocalWithdrawal(withdrawal)

                if (!localSuccess) {
                    setError('Failed to save withdrawal locally')
                    return false
                }

                // Update state immediately
                setWithdrawals((prev) => {
                    const existing = prev.findIndex((w) => w.id === withdrawal.id)
                    if (existing >= 0) {
                        const updated = [...prev]
                        updated[existing] = withdrawal
                        return updated
                    }
                    return [withdrawal, ...prev]
                })

                // 2. Sync to Supabase in background (don't block)
                if (isSupabaseEnabled) {
                    saveWithdrawalToSupabase(withdrawal).catch((err) => {
                        console.warn('[useWithdrawals] Failed to sync to Supabase:', err)
                    })
                }

                return true
            } catch (err: any) {
                console.error('[useWithdrawals] Error saving withdrawal:', err)
                setError(err.message || 'Failed to save withdrawal')
                return false
            }
        },
        [isSupabaseEnabled]
    )

    /**
     * Update withdrawal status in both localStorage and Supabase
     */
    const updateStatus = useCallback(
        async (
            id: string,
            status: WithdrawalStatus,
            updates?: Partial<StoredWithdrawal>
        ): Promise<boolean> => {
            try {
                // 1. Update localStorage first
                const localSuccess = updateLocalStatus(id, status, updates)

                if (!localSuccess) {
                    setError('Failed to update withdrawal status')
                    return false
                }

                // Update state immediately
                setWithdrawals((prev) =>
                    prev.map((w) =>
                        w.id === id ? { ...w, status, ...updates } : w
                    )
                )

                // 2. Sync to Supabase in background
                if (isSupabaseEnabled) {
                    updateWithdrawalStatusInSupabase(id, status, updates).catch((err) => {
                        console.warn('[useWithdrawals] Failed to sync status to Supabase:', err)
                    })
                }

                return true
            } catch (err: any) {
                console.error('[useWithdrawals] Error updating status:', err)
                setError(err.message || 'Failed to update status')
                return false
            }
        },
        [isSupabaseEnabled]
    )

    /**
     * Delete a withdrawal from both localStorage and Supabase
     */
    const deleteWithdrawal = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                // 1. Delete from localStorage first
                const localSuccess = deleteLocalWithdrawal(id)

                if (!localSuccess) {
                    setError('Failed to delete withdrawal')
                    return false
                }

                // Update state immediately
                setWithdrawals((prev) => prev.filter((w) => w.id !== id))

                // 2. Delete from Supabase in background
                if (isSupabaseEnabled) {
                    deleteWithdrawalFromSupabase(id).catch((err) => {
                        console.warn('[useWithdrawals] Failed to delete from Supabase:', err)
                    })
                }

                return true
            } catch (err: any) {
                console.error('[useWithdrawals] Error deleting withdrawal:', err)
                setError(err.message || 'Failed to delete withdrawal')
                return false
            }
        },
        [isSupabaseEnabled]
    )

    /**
     * Force refresh from both storage sources
     */
    const refresh = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        await loadWithdrawals()
    }, [loadWithdrawals])

    /**
     * Sync all local withdrawals to Supabase
     */
    const syncToCloud = useCallback(async (): Promise<number> => {
        if (!isSupabaseEnabled) return 0

        setIsSyncing(true)
        try {
            const localWithdrawals = getLocalWithdrawals()
            const filtered = walletAddress
                ? localWithdrawals.filter(
                      (w) => w.fromAddress?.toLowerCase() === walletAddress.toLowerCase()
                  )
                : localWithdrawals

            const synced = await syncLocalToSupabase(filtered)
            lastSyncRef.current = Date.now()
            return synced
        } finally {
            setIsSyncing(false)
        }
    }, [walletAddress, isSupabaseEnabled])

    // Initial load
    useEffect(() => {
        loadWithdrawals()
    }, [loadWithdrawals])

    // Auto-sync on interval
    useEffect(() => {
        if (!autoSync || !isSupabaseEnabled || !walletAddress) return

        const sync = () => {
            const timeSinceLastSync = Date.now() - lastSyncRef.current
            if (timeSinceLastSync >= syncInterval) {
                loadWithdrawals()
            }
        }

        syncTimeoutRef.current = setInterval(sync, syncInterval)

        return () => {
            if (syncTimeoutRef.current) {
                clearInterval(syncTimeoutRef.current)
            }
        }
    }, [autoSync, isSupabaseEnabled, walletAddress, syncInterval, loadWithdrawals])

    return {
        withdrawals,
        isLoading,
        isSyncing,
        error,
        isSupabaseEnabled,
        saveWithdrawal,
        updateStatus,
        deleteWithdrawal,
        refresh,
        syncToCloud,
    }
}

// Re-export for convenience
export { generateWithdrawalId }
