import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupportedChains } from '@lib/server/services/optimismViemService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        supportedOpStackChains: getSupportedChains(),
    })
}
