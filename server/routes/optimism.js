import { Router } from 'express'
import {
    getOptimismWithdrawalStatus,
    generateOptimismProof,
    getOptimismFinalizationData,
} from '../services/optimismViemService.js'
import { validateWithdrawalMiddleware } from '../middleware/validation.js'
import { serverLogger as log } from '../utils/logger.js'

const router = Router()
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Get withdrawal message status (viem-based, supports fault proofs)
 *
 * POST /api/withdrawal/status
 * Body: { txHash, l2ChainId, l1ChainId }
 */
router.post('/status', validateWithdrawalMiddleware, async (req, res) => {
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
router.post('/generate-proof', validateWithdrawalMiddleware, async (req, res) => {
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
router.post('/finalization-data', validateWithdrawalMiddleware, async (req, res) => {
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

export default router
