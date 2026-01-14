# Exit Hatch Backend Service

Backend service for generating Optimism withdrawal proofs using the Optimism SDK with ethers v5.

## Why a Backend Service?

The Optimism SDK requires ethers v5, but the frontend uses ethers v6. Browser-based proof generation has compatibility issues, so we use a Node.js backend with the correct dependencies.

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if you want to use custom RPC endpoints or change the port.

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on http://localhost:3001

### 4. Configure Frontend

In the root directory, create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-12T10:00:00.000Z",
  "version": "1.0.0"
}
```

### Check Withdrawal Status

```bash
POST /api/withdrawal/status
Content-Type: application/json

{
  "txHash": "0x...",
  "l2ChainId": 11155420,
  "l1ChainId": 11155111
}
```

**Response:**
```json
{
  "success": true,
  "status": "READY_TO_PROVE",
  "statusCode": 3,
  "ready": true,
  "readyToFinalize": false
}
```

**Status Values:**
- `UNCONFIRMED_L1_TO_L2_MESSAGE` - L1 to L2 message not confirmed
- `FAILED_L1_TO_L2_MESSAGE` - L1 to L2 message failed
- `STATE_ROOT_NOT_PUBLISHED` - Waiting for state root
- `READY_TO_PROVE` - Ready to generate proof
- `IN_CHALLENGE_PERIOD` - Waiting for challenge period
- `READY_FOR_RELAY` - Ready to finalize
- `RELAYED` - Already finalized

### Generate Withdrawal Proof

```bash
POST /api/withdrawal/generate-proof
Content-Type: application/json

{
  "txHash": "0x...",
  "l2ChainId": 11155420,
  "l1ChainId": 11155111
}
```

**Response:**
```json
{
  "success": true,
  "proofData": {
    "withdrawalTransaction": {
      "nonce": "0",
      "sender": "0x...",
      "target": "0x...",
      "value": "0",
      "gasLimit": "200000",
      "data": "0x..."
    },
    "l2OutputIndex": 12345,
    "outputRootProof": {
      "version": "0x...",
      "stateRoot": "0x...",
      "messagePasserStorageRoot": "0x...",
      "latestBlockhash": "0x..."
    },
    "withdrawalProof": ["0x...", "0x..."]
  }
}
```

### Get Finalization Data

```bash
POST /api/withdrawal/finalization-data
Content-Type: application/json

{
  "txHash": "0x...",
  "l2ChainId": 11155420,
  "l1ChainId": 11155111
}
```

**Response:**
```json
{
  "success": true,
  "ready": true,
  "statusCode": 5,
  "message": "Withdrawal can be finalized via SDK finalizeMessage() method"
}
```

## Supported Networks

### Mainnet
- **L1**: Ethereum Mainnet (Chain ID: 1)
- **L2**: Optimism Mainnet (Chain ID: 10)

### Testnet
- **L1**: Sepolia (Chain ID: 11155111)
- **L2**: Optimism Sepolia (Chain ID: 11155420)

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# RPC URLs (optional - defaults provided)
MAINNET_L1_RPC=https://eth.llamarpc.com
MAINNET_L2_RPC=https://mainnet.optimism.io
SEPOLIA_L1_RPC=https://rpc.sepolia.org
SEPOLIA_L2_RPC=https://sepolia.optimism.io

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

## Testing

### Test Health Check

```bash
curl http://localhost:3001/health
```

### Test Proof Generation (Testnet)

Replace with your actual withdrawal transaction hash:

```bash
curl -X POST http://localhost:3001/api/withdrawal/generate-proof \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0xYOUR_TX_HASH",
    "l2ChainId": 11155420,
    "l1ChainId": 11155111
  }'
```

## Production Deployment

### Docker (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

Build and run:

```bash
docker build -t exit-hatch-backend .
docker run -p 3001:3001 --env-file .env exit-hatch-backend
```

### Vercel/Railway/Render

1. Push the `server/` directory to a Git repository
2. Connect to your deployment platform
3. Set environment variables
4. Deploy

### Environment Considerations

- **RPC Endpoints**: Use dedicated RPC providers (Alchemy, Infura, etc.) for production
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Authentication**: Add API keys if needed for production
- **CORS**: Configure allowed origins properly
- **Monitoring**: Add logging and monitoring (e.g., Sentry)

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

### Cannot Connect from Frontend

1. Check backend is running: `curl http://localhost:3001/health`
2. Check CORS configuration in `.env`
3. Ensure `NEXT_PUBLIC_BACKEND_URL` is set in frontend `.env.local`
4. Check browser console for CORS errors

### Proof Generation Fails

1. Verify transaction is a valid withdrawal
2. Ensure state root has been published (~1 hour after withdrawal)
3. Check RPC endpoints are working
4. View server logs for detailed error messages

### Connection Refused

```bash
# Check if server is running
ps aux | grep node

# Check server logs
npm run dev  # Will show detailed logs
```

## Architecture

```
Frontend (Next.js + ethers v6)
    ↓
Backend Service (Node.js + ethers v5)
    ↓
Optimism SDK (@eth-optimism/sdk)
    ↓
RPC Providers (L1 & L2)
```

## Security Notes

- This service doesn't handle private keys or sign transactions
- All transaction signing happens in the user's wallet (MetaMask)
- The backend only reads blockchain data and generates proofs
- No sensitive user data is stored

## Contributing

To add support for more rollups (Arbitrum, Base, etc.):

1. Add chain IDs to `RPC_URLS` configuration
2. Install respective SDK if needed
3. Add endpoints for the new rollup
4. Update frontend configuration

## License

Same as the main project.
