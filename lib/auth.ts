import { createHash, createHmac, timingSafeEqual } from 'crypto'

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000
export const SESSION_COOKIE = 'kv_session'

function secret() {
  return process.env.AUTH_SECRET ?? 'karavision-dev-secret-change-me'
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password.trim()).digest('hex')
}

export function createSessionToken(): string {
  const expiry = Date.now() + SESSION_TTL
  const sig = createHmac('sha256', secret()).update(String(expiry)).digest('hex')
  return Buffer.from(JSON.stringify({ sig, expiry })).toString('base64url')
}

export function verifySessionToken(token: string): boolean {
  try {
    const { sig, expiry } = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (Date.now() > expiry) return false
    const expected = createHmac('sha256', secret()).update(String(expiry)).digest('hex')
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// storedHash: SHA-256 hex from blob (takes priority over env var)
export function checkAdminPassword(input: string, storedHash?: string | null): boolean {
  const trimmed = input.trim()
  if (storedHash) {
    const inputHash = hashPassword(trimmed)
    try {
      return timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash))
    } catch {
      return false
    }
  }
  // Fallback: env var (trim to fix Windows echo \n issue)
  const stored = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (!stored) return false
  try {
    const a = Buffer.from(trimmed)
    const b = Buffer.from(stored)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
