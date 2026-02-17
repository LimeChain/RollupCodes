import { Router } from 'express'
import {
    getArbitrumWithdrawalStatus,
    getArbitrumOutboxProof,
    checkArbitrumChallengePeriod
} from '../services/arbitrumProofService.js'
import { validateWithdrawalMiddleware } from '../middleware/validation.js'
import { serverLogger as log } from '../utils/logger.js'

const router = Router()
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Arbitrum: Get withdrawal status
 *
 * POST /api/arbitrum/withdrawal/status
 * Body: { txHash, l2ChainId, l1ChainId }
 */
router.post('/status', validateWithdrawalMiddleware, async (req, res) => {
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
router.post('/generate-proof', validateWithdrawalMiddleware, async (req, res) => {
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
router.post('/challenge-period', validateWithdrawalMiddleware, async (req, res) => {
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

export default router
