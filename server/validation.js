/**
 * Input validation utilities for Exit Hatch API
 */

/**
 * Validate Ethereum transaction hash
 * Must be 66 characters (0x + 64 hex chars)
 */
export function isValidTxHash(txHash) {
    if (typeof txHash !== 'string') return false
    if (txHash.length !== 66) return false
    if (!txHash.startsWith('0x')) return false
    return /^0x[a-fA-F0-9]{64}$/.test(txHash)
}

/**
 * Validate chain ID
 * Must be a positive integer
 */
export function isValidChainId(chainId) {
    if (typeof chainId !== 'number') return false
    if (!Number.isInteger(chainId)) return false
    return chainId > 0
}

/**
 * Validate withdrawal request body
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateWithdrawalRequest(body) {
    const { txHash, l2ChainId, l1ChainId } = body || {}

    if (!txHash) {
        return { valid: false, error: 'Missing required parameter: txHash' }
    }

    if (!isValidTxHash(txHash)) {
        return { valid: false, error: 'Invalid txHash format. Must be 0x followed by 64 hex characters' }
    }

    if (!l2ChainId) {
        return { valid: false, error: 'Missing required parameter: l2ChainId' }
    }

    if (!isValidChainId(l2ChainId)) {
        return { valid: false, error: 'Invalid l2ChainId. Must be a positive integer' }
    }

    if (!l1ChainId) {
        return { valid: false, error: 'Missing required parameter: l1ChainId' }
    }

    if (!isValidChainId(l1ChainId)) {
        return { valid: false, error: 'Invalid l1ChainId. Must be a positive integer' }
    }

    return { valid: true }
}

/**
 * Express middleware for validating withdrawal requests
 */
export function validateWithdrawalMiddleware(req, res, next) {
    const validation = validateWithdrawalRequest(req.body)

    if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
    }

    next()
}
