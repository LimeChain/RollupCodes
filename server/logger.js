/**
 * Logger utility for Exit Hatch Backend
 *
 * Respects NODE_ENV to disable verbose logging in production.
 */

const isDev = process.env.NODE_ENV === 'development'

function shouldLog(level, forceInProd = false) {
    if (isDev) return true
    if (forceInProd) return true
    return level === 'error'
}

function formatMessage(prefix, args) {
    if (prefix) {
        return [`[${prefix}]`, ...args]
    }
    return args
}

const createLogger = (prefix) => ({
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

module.exports = {
    logger: createLogger(),
    viemLogger: createLogger('viem'),
    arbitrumLogger: createLogger('arbitrum'),
    serverLogger: createLogger('server'),
}
