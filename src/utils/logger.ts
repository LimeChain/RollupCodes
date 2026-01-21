/**
 * Logger utility for Exit Hatch
 *
 * Respects NODE_ENV to disable verbose logging in production.
 * Only error logs are shown in production by default.
 */

const isDev = process.env.NODE_ENV === 'development'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
    prefix?: string
    forceInProd?: boolean
}

function formatMessage(prefix: string | undefined, args: unknown[]): unknown[] {
    if (prefix) {
        return [`[${prefix}]`, ...args]
    }
    return args
}

function shouldLog(level: LogLevel, forceInProd?: boolean): boolean {
    if (isDev) return true
    if (forceInProd) return true
    // In production, only log errors by default
    return level === 'error'
}

export const logger = {
    debug: (prefix?: string) => (...args: unknown[]) => {
        if (shouldLog('debug')) {
            console.log(...formatMessage(prefix, args))
        }
    },

    info: (prefix?: string) => (...args: unknown[]) => {
        if (shouldLog('info')) {
            console.log(...formatMessage(prefix, args))
        }
    },

    warn: (prefix?: string) => (...args: unknown[]) => {
        if (shouldLog('warn')) {
            console.warn(...formatMessage(prefix, args))
        }
    },

    error: (prefix?: string) => (...args: unknown[]) => {
        if (shouldLog('error')) {
            console.error(...formatMessage(prefix, args))
        }
    },
}

// Pre-configured loggers for different modules
export const withdrawalLogger = {
    debug: logger.debug('withdrawal'),
    info: logger.info('withdrawal'),
    warn: logger.warn('withdrawal'),
    error: logger.error('withdrawal'),
}

export const proofLogger = {
    debug: logger.debug('proof'),
    info: logger.info('proof'),
    warn: logger.warn('proof'),
    error: logger.error('proof'),
}

export const arbitrumLogger = {
    debug: logger.debug('arbitrum'),
    info: logger.info('arbitrum'),
    warn: logger.warn('arbitrum'),
    error: logger.error('arbitrum'),
}

export const storageLogger = {
    debug: logger.debug('storage'),
    info: logger.info('storage'),
    warn: logger.warn('storage'),
    error: logger.error('storage'),
}

export const walletLogger = {
    debug: logger.debug('wallet'),
    info: logger.info('wallet'),
    warn: logger.warn('wallet'),
    error: logger.error('wallet'),
}
