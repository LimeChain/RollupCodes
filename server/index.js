import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import {
    getOptimismWithdrawalStatus,
    generateOptimismProof,
    getOptimismFinalizationData,
    getSupportedChains,
} from './optimismViemService.js'
import {
    getArbitrumWithdrawalStatus,
    getArbitrumOutboxProof,
    checkArbitrumChallengePeriod
} from './arbitrumProofService.js'
import { validateWithdrawalMiddleware } from './validation.js'
import { serverLogger as log } from './logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== 'production'

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})

// Middleware
app.use(express.json())
app.use(limiter)

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000']
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        supportedOpStackChains: getSupportedChains(),
    })
})

/**
 * Get withdrawal message status (viem-based, supports fault proofs)
 *
 * POST /api/withdrawal/status
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/withdrawal/status', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body
        const result = await getOptimismWithdrawalStatus(txHash, l2ChainId, l1ChainId)
        res.json(result)
    } catch (error) {
        log.error('Error checking status:', error.message)
        res.status(500).json({
            error: isDev ? error.message : 'Failed to check withdrawal status'
        })
    }
})

/**
 * Generate withdrawal proof (viem-based, supports fault proofs)
 *
 * POST /api/withdrawal/generate-proof
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/withdrawal/generate-proof', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body
        const result = await generateOptimismProof(txHash, l2ChainId, l1ChainId)
        res.json(result)
    } catch (error) {
        log.error('Error generating proof:', error.message)
        const statusCode = error.statusCode ? 400 : 500
        res.status(statusCode).json({
            error: isDev ? error.message : 'Failed to generate proof',
            ...(error.statusCode && { statusCode: error.statusCode }),
        })
    }
})

/**
 * Get withdrawal data for finalization (viem-based, supports fault proofs)
 *
 * POST /api/withdrawal/finalization-data
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/withdrawal/finalization-data', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body
        const result = await getOptimismFinalizationData(txHash, l2ChainId, l1ChainId)
        res.json(result)
    } catch (error) {
        log.error('Error getting finalization data:', error.message)
        res.status(500).json({
            error: isDev ? error.message : 'Failed to get finalization data'
        })
    }
})

/**
 * Arbitrum: Get withdrawal status
 *
 * POST /api/arbitrum/withdrawal/status
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/arbitrum/withdrawal/status', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body

        log.info(`Checking Arbitrum status for tx: ${txHash}`)

        const result = await getArbitrumWithdrawalStatus(txHash, l2ChainId, l1ChainId)

        if (!result.success) {
            return res.status(400).json({
                error: result.error,
                statusCode: result.statusCode
            })
        }

        res.json(result)
    } catch (error) {
        log.error('Error checking Arbitrum status:', error.message)
        res.status(500).json({
            error: isDev ? error.message : 'Failed to check withdrawal status'
        })
    }
})

/**
 * Arbitrum: Generate outbox proof
 *
 * POST /api/arbitrum/withdrawal/generate-proof
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/arbitrum/withdrawal/generate-proof', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body

        log.info(`Generating Arbitrum proof for tx: ${txHash}`)

        const result = await getArbitrumOutboxProof(txHash, l2ChainId, l1ChainId)

        if (!result.success) {
            return res.status(400).json({
                error: result.error,
                statusCode: result.statusCode
            })
        }

        res.json(result)
    } catch (error) {
        log.error('Error generating Arbitrum proof:', error.message)
        res.status(500).json({
            error: isDev ? error.message : 'Failed to generate proof'
        })
    }
})

/**
 * Arbitrum: Check challenge period
 *
 * POST /api/arbitrum/withdrawal/challenge-period
 * Body: { txHash, l2ChainId, l1ChainId }
 */
app.post('/api/arbitrum/withdrawal/challenge-period', validateWithdrawalMiddleware, async (req, res) => {
    try {
        const { txHash, l2ChainId, l1ChainId } = req.body

        log.info(`Checking Arbitrum challenge period for tx: ${txHash}`)

        const result = await checkArbitrumChallengePeriod(txHash, l2ChainId, l1ChainId)

        if (!result.success) {
            return res.status(400).json({
                error: result.error
            })
        }

        res.json(result)
    } catch (error) {
        log.error('Error checking challenge period:', error.message)
        res.status(500).json({
            error: isDev ? error.message : 'Failed to check challenge period'
        })
    }
})

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    log.error('Unhandled error:', err.message)
    res.status(500).json({
        error: isDev ? err.message : 'Internal server error'
    })
})

// Start server
app.listen(PORT, () => {
    log.info(`Exit Hatch Backend Server running on port ${PORT}`)
    log.info(`Health check: http://localhost:${PORT}/health`)
    log.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    log.info(`Supported OP Stack chains: ${getSupportedChains().join(', ')}`)
    log.info('')
    log.info('Available endpoints:')
    log.info('  Optimism (viem - fault proof support):')
    log.info('    POST /api/withdrawal/status')
    log.info('    POST /api/withdrawal/generate-proof')
    log.info('    POST /api/withdrawal/finalization-data')
    log.info('  Arbitrum:')
    log.info('    POST /api/arbitrum/withdrawal/status')
    log.info('    POST /api/arbitrum/withdrawal/generate-proof')
    log.info('    POST /api/arbitrum/withdrawal/challenge-period')
})
