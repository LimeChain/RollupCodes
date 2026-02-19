/**
 * Supabase Client Configuration
 *
 * Initializes the Supabase client for database operations.
 * Uses environment variables for configuration.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables (set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance
let supabaseInstance: SupabaseClient | null = null

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Get the Supabase client instance
 * Returns null if Supabase is not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
    if (!isSupabaseConfigured()) {
        return null
    }

    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
            auth: {
                persistSession: false, // We use wallet auth, not Supabase auth
            },
        })
    }

    return supabaseInstance
}

/**
 * Get Supabase client or throw if not configured
 */
export function requireSupabaseClient(): SupabaseClient {
    const client = getSupabaseClient()
    if (!client) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
        )
    }
    return client
}
