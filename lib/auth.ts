import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
export const SESSION_COOKIE = 'kv_session'

function secret() {
  return process.env.AUTH_SECRET ?? 'karavision-dev-secret-change-me'
}

export function createSessionToken(): string {
  const expiry = Date.now() + SESSION_TTL
  const payload = `${expiry}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ sig, expiry })).toString('base64url')
}

export function verifySessionToken(token: string): boolean {
  try {
    const { sig, expiry } = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (Date.now() > expiry) return false
    const expected = createHmac('sha256', secret())
      .update(String(expiry))
      .digest('hex')
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function checkAdminPassword(input: string): boolean {
  const stored = process.env.ADMIN_PASSWORD ?? ''
  if (!stored) return false
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(stored))
  } catch {
    return false
  }
}
