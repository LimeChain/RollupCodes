# Exit Hatch Configuration Files

This directory contains the configuration data for the Exit Hatch feature, which allows users to withdraw ETH from L2 networks back to Ethereum L1.

## Schema Version: 1.0

Each JSON file represents a specific L2 network's exit hatch configuration.

## File Structure

```
exit-hatch/
├── README.md              # This file
├── optimism.json          # Optimism configuration
├── arbitrum-one.json      # Arbitrum One configuration
├── base.json              # Base configuration
└── [network].json         # Additional networks
```

## Schema Overview

### Top-Level Fields

- `schema_version` (string): Version of the schema format
- `network` (string): Network identifier (matches slug)
- `chain_id` (number): L2 chain ID
- `last_updated` (string): ISO date of last update
- `network_display` (object): UI display information
- `supported_asset` (object): Asset configuration (ETH only for now)
- `bridge_contracts` (object): Contract addresses for withdrawal
- `withdrawal_flow` (object): Step-by-step withdrawal process
- `validation` (object): Form validation rules
- `ui_text` (object): All UI copy and labels
- `documentation_urls` (array): Help documentation links

### Network Display

Contains branding and network information:
- `name`: Display name (e.g., "Optimism")
- `slug`: URL-safe identifier
- `icon`: Logo filename
- `color`: Brand color (hex)
- `l2_chain_id`: L2 chain ID
- `l1_chain_id`: L1 chain ID (always 1 for Ethereum)
- `l1_network_name`: L1 network name (always "Ethereum")
- `rpc_url`: L2 RPC endpoint
- `explorer_url`: L2 block explorer

### Supported Asset

Currently supports ETH only:
- `symbol`: "ETH"
- `name`: "Ethereum"
- `decimals`: 18
- `is_native`: true
- `l2_address`: L2 ETH address
- `l1_address`: L1 ETH address (0x0...0)

### Bridge Contracts

Contract addresses for the withdrawal process:
- `l2_bridge`: L2 bridge contract
- `l1_portal` or `l1_outbox`: L1 contract for finalization

### Withdrawal Flow

Defines the step-by-step withdrawal process:
- `total_estimated_time`: Human-readable total time
- `challenge_period_days`: Challenge period in days
- `steps`: Array of withdrawal steps

Each step contains:
- `id`: Unique step identifier
- `order`: Step number
- `name`: Step title
- `description`: Short description
- `network`: "l2" or "l1"
- `contract_address`: Contract address (if applicable)
- `contract_name`: Contract name
- `method`: Contract method to call
- `user_action_required`: "sign_transaction" or "wait"
- `estimated_time`: Human-readable time estimate
- `estimated_gas`: Gas cost estimate
- `ui_button_text`: Button label (if applicable)
- `ui_status_messages`: Status messages for different states

### Validation

Form validation rules:
- `min_withdrawal_amount_eth`: Minimum withdrawal amount
- `max_withdrawal_amount_eth`: Maximum withdrawal amount (null = unlimited)
- `requires_wallet_connection`: Whether wallet connection is required
- `supported_wallets`: Array of supported wallet providers
- `destination_network`: Destination network configuration

### UI Text

All UI copy organized by component:
- `page_title`: Page title
- `page_description`: Page description
- `connect_wallet_prompt`: Wallet connection prompt
- `tabs`: Tab labels
- `form_labels`: Form field labels
- `button_states`: Button text for different states
- `transaction_modal`: Transaction modal text
- `notifications`: Notification messages

## Adding a New Network

1. Create a new JSON file: `[network-slug].json`
2. Copy the structure from an existing file (e.g., `optimism.json`)
3. Update all network-specific values:
   - Network display information
   - Chain IDs
   - Contract addresses
   - RPC and explorer URLs
   - Withdrawal flow steps (may differ between networks)
4. Validate the JSON structure
5. Test with the Exit Hatch UI

## Network-Specific Differences

### OP Stack Chains (Optimism, Base, etc.)
- Use `L2StandardBridge` for initiation
- Require 5-step process: initiate → wait → prove → wait → finalize
- 7-day challenge period
- Use `OptimismPortal` on L1

### Arbitrum
- Use `ArbSys` precompile for initiation
- Require 3-step process: initiate → wait → execute
- 7-day challenge period
- Use `Outbox` contract on L1

## Maintenance

When updating configurations:
1. Update `last_updated` field with current date
2. Verify contract addresses are current
3. Check documentation URLs are valid
4. Test withdrawal flow in UI

## References

- [Optimism Withdrawals](https://docs.optimism.io/builders/app-developers/bridging/messaging)
- [Arbitrum Withdrawals](https://docs.arbitrum.io/how-arbitrum-works/arbos/l2-l1-messaging)
- [Base Documentation](https://docs.base.org/)
