import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { getConfig } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  const config = await getConfig()

  if (!checkAdminPassword(password, config.adminPasswordHash)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
