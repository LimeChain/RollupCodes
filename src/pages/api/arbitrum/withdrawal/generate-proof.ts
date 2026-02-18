import type { NextApiRequest, NextApiResponse } from 'next'
import { validateWithdrawalRequest } from '@lib/server/validation'
import { getArbitrumOutboxProof } from '@lib/server/services/arbitrumProofService'
import { checkRateLimit, getClientIp } from '@lib/server/rateLimit'

export const config = {
    maxDuration: 30,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const ip = getClientIp(req.headers, req.socket.remoteAddress)
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests, please try again later' })
    }

    const validation = validateWithdrawalRequest(req.body)
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
    }

    try {
        const { txHash, l2ChainId, l1ChainId } = req.body
        const result = await getArbitrumOutboxProof(txHash, l2ChainId, l1ChainId)

        if (!result.success) {
            return res.status(400).json({ error: result.error })
        }

        return res.status(200).json(result)
    } catch (error: unknown) {
        const isDev = process.env.NODE_ENV !== 'production'
        const err = error as Error
        return res.status(500).json({
            error: isDev ? err.message : 'Failed to generate proof'
        })
    }
}
