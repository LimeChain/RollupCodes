# Supabase Setup for Exit Hatch

This guide explains how to set up Supabase for persistent storage of withdrawal transactions.

## Overview

The Exit Hatch feature uses a **hybrid storage approach**:

1. **localStorage** (Primary) - Fast, works offline, no setup required
2. **Supabase** (Backup/Sync) - Cloud backup, cross-device sync, optional

If Supabase is not configured, the app works perfectly with localStorage only.

## Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose a name and set a database password
4. Wait for the project to be created (~2 minutes)

### 2. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and click **Run**
4. You should see "Success. No rows returned"

### 3. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Restart Your Dev Server

```bash
npm run dev
```

The app will now sync withdrawals to Supabase automatically.

## Security Notes

### Why is the anon key safe to expose?

The Supabase anon key is designed to be public. Security is enforced by:

1. **Row Level Security (RLS)** - Database-level access control
2. **Public blockchain data** - All withdrawal data is already public on-chain

### What data is stored?

Only publicly verifiable blockchain data:
- Transaction hashes
- Wallet addresses
- Amounts
- Network/chain IDs
- Withdrawal status

**No private keys or secrets are ever stored.**

## Database Schema

The `withdrawals` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique withdrawal ID |
| `wallet_address` | TEXT | User's wallet address |
| `transaction_hash` | TEXT | L2 transaction hash |
| `rollup_type` | ENUM | optimism, arbitrum, base, other |
| `source_chain_id` | INTEGER | L2 chain ID |
| `destination_chain_id` | INTEGER | L1 chain ID |
| `amount` | DECIMAL | Amount in ETH |
| `status` | ENUM | Current withdrawal status |
| `current_step` | INTEGER | Progress step (1-5) |
| `contracts` | JSONB | Contract addresses |
| `proof_data` | JSONB | Merkle proof data |
| `*_at` | TIMESTAMP | Various timestamps |

## Troubleshooting

### "Supabase is not configured"

Make sure your `.env.local` file has both:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

And restart the dev server.

### "relation 'withdrawals' does not exist"

Run the `schema.sql` in your Supabase SQL Editor.

### Data not syncing

Check the browser console for `[Supabase]` or `[withdrawalStorage]` messages.

## Free Tier Limits

Supabase free tier includes:
- 500 MB database storage (~500,000 withdrawals)
- Unlimited API requests
- 2 projects

More than enough for typical usage.
