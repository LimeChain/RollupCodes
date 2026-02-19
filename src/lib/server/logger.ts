/**
 * Logger utility for API routes
 *
 * Respects NODE_ENV to disable verbose logging in production.
 */

const isDev = process.env.NODE_ENV === 'development'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function shouldLog(level: LogLevel): boolean {
    if (isDev) return true
    return level === 'error'
}

function formatMessage(prefix: string | undefined, args: unknown[]): unknown[] {
    if (prefix) {
        return [`[${prefix}]`, ...args]
    }
    return args
}

interface Logger {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
}

const createLogger = (prefix?: string): Logger => ({
    debug: (...args) => {
        if (shouldLog('debug')) {
            console.log(...formatMessage(prefix, args))
        }
    },
    info: (...args) => {
        if (shouldLog('info')) {
            console.log(...formatMessage(prefix, args))
        }
    },
    warn: (...args) => {
        if (shouldLog('warn')) {
            console.warn(...formatMessage(prefix, args))
        }
    },
    error: (...args) => {
        if (shouldLog('error')) {
            console.error(...formatMessage(prefix, args))
        }
    },
})

export const logger = createLogger()
export const viemLogger = createLogger('viem')
export const arbitrumLogger = createLogger('arbitrum')
export const serverLogger = createLogger('server')
