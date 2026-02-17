import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { getSupportedChains } from './services/optimismViemService.js'
import { serverLogger as log } from './utils/logger.js'
import optimismRoutes from './routes/optimism.js'
import arbitrumRoutes from './routes/arbitrum.js'

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
        // In production, block requests with no origin
        if (!origin && !isDev) {
            return callback(new Error('No origin header - request blocked'))
        }
        // In development, allow no-origin requests (curl, Postman)
        if (!origin && isDev) {
            return callback(null, true)
        }
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

// Routes
app.use('/api/withdrawal', optimismRoutes)
app.use('/api/arbitrum/withdrawal', arbitrumRoutes)

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    log.error('Unhandled error:', err.message)
    res.status(500).json({
        error: isDev ? err.message : 'Internal server error'
    })
})

// Start server (local development only)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        log.info(`Exit Hatch Backend Server running on port ${PORT}`)
        log.info(`Health check: http://localhost:${PORT}/health`)
        log.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
        log.info(`Supported OP Stack chains: ${getSupportedChains().join(', ')}`)
    })
}

// Export for Vercel
export default app
