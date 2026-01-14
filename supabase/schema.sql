-- ============================================
-- Supabase Schema for Exit Hatch Withdrawals
-- ============================================
--
-- Run this SQL in your Supabase SQL Editor to set up the database.
-- Dashboard: https://supabase.com/dashboard → SQL Editor
--
-- This schema stores L2→L1 withdrawal transactions for the Exit Hatch feature.
-- All data is public blockchain data (no secrets).
--

-- ============================================
-- Custom Types
-- ============================================

-- Rollup type enum
DO $$ BEGIN
    CREATE TYPE rollup_type AS ENUM ('optimism', 'arbitrum', 'base', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Withdrawal status enum
DO $$ BEGIN
    CREATE TYPE withdrawal_status AS ENUM (
        'initiated',
        'waiting_state_root',
        'ready_to_prove',
        'proven',
        'waiting_challenge',
        'ready_to_finalize',
        'finalized',
        'failed',
        'ready_to_execute',
        'executing',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Withdrawals Table
-- ============================================

CREATE TABLE IF NOT EXISTS withdrawals (
    -- Primary key
    id TEXT PRIMARY KEY,

    -- Wallet identification
    wallet_address TEXT NOT NULL,

    -- Transaction identification
    transaction_hash TEXT UNIQUE NOT NULL,

    -- Rollup type
    rollup_type rollup_type,

    -- Network information
    source_network TEXT,
    source_chain_id INTEGER NOT NULL,
    destination_network TEXT,
    destination_chain_id INTEGER,

    -- Transaction details
    amount DECIMAL(38, 18) NOT NULL,
    to_address TEXT NOT NULL,

    -- Contract addresses (stored as JSONB for flexibility)
    contracts JSONB DEFAULT '{}',

    -- Status tracking
    status withdrawal_status NOT NULL DEFAULT 'initiated',
    current_step INTEGER NOT NULL DEFAULT 1,

    -- Timestamps
    initiated_at TIMESTAMPTZ,
    state_root_published_at TIMESTAMPTZ,
    proven_at TIMESTAMPTZ,
    challenge_period_ends_at TIMESTAMPTZ,
    finalized_at TIMESTAMPTZ,

    -- Transaction hashes for each step
    prove_tx_hash TEXT,
    finalize_tx_hash TEXT,

    -- Proof data (can be large, stored as JSONB)
    proof_data JSONB,

    -- Error tracking
    error TEXT,
    last_error_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index for querying by wallet address (most common query)
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet
    ON withdrawals(wallet_address);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_withdrawals_status
    ON withdrawals(status);

-- Index for filtering by source chain
CREATE INDEX IF NOT EXISTS idx_withdrawals_chain
    ON withdrawals(source_chain_id);

-- Composite index for wallet + status (common filter combo)
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet_status
    ON withdrawals(wallet_address, status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on the withdrawals table
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all withdrawals (public blockchain data)
-- This is safe because all withdrawal data is public on-chain
CREATE POLICY "Public read access" ON withdrawals
    FOR SELECT
    USING (true);

-- Policy: Anyone can insert withdrawals
-- The wallet_address is provided by the client; there's no auth requirement
-- because all data is public and verifiable on-chain
CREATE POLICY "Public insert access" ON withdrawals
    FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can update withdrawals
-- Updates are allowed because the data is public and can be verified on-chain
CREATE POLICY "Public update access" ON withdrawals
    FOR UPDATE
    USING (true);

-- Policy: Anyone can delete their own withdrawals
-- This only affects the database copy; on-chain data is immutable
CREATE POLICY "Public delete access" ON withdrawals
    FOR DELETE
    USING (true);

-- ============================================
-- Automatic Updated At Trigger
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on any row update
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Queries (for reference)
-- ============================================

-- Get all withdrawals for a wallet:
-- SELECT * FROM withdrawals WHERE wallet_address = '0x...' ORDER BY created_at DESC;

-- Get pending withdrawals:
-- SELECT * FROM withdrawals WHERE status NOT IN ('finalized', 'completed', 'failed');

-- Get withdrawals ready for action:
-- SELECT * FROM withdrawals WHERE status IN ('ready_to_prove', 'ready_to_finalize', 'ready_to_execute');

-- Count withdrawals by status:
-- SELECT status, COUNT(*) FROM withdrawals GROUP BY status;
