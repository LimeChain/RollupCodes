/**
 * Simple in-memory rate limiter for API routes.
 *
 * Best-effort only — each serverless function instance has its own map,
 * so limits are not globally consistent. Vercel's built-in DDoS protection
 * handles the heavy lifting.
 */

interface RateLimitRecord {
    count: number
    resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

export function checkRateLimit(
    ip: string,
    limit = 100,
    windowMs = 60000
): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(ip)

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
        return true
    }

    if (record.count >= limit) {
        return false
    }

    record.count++
    return true
}

export function getClientIp(headers: Record<string, string | string[] | undefined>, remoteAddress?: string): string {
    const realIp = headers['x-real-ip']
    if (typeof realIp === 'string') return realIp
    const forwarded = headers['x-forwarded-for']
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
    return remoteAddress || 'unknown'
}
