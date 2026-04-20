import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken, checkAdminPassword, hashPassword } from '@/lib/auth'
import { getConfig, saveConfig } from '@/lib/storage'

function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  return !!token && verifySessionToken(token)
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { current, newPassword } = await req.json().catch(() => ({}))

  if (!current || !newPassword || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  if (newPassword.trim().length < 6) {
    return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, { status: 400 })
  }

  const config = await getConfig()

  if (!checkAdminPassword(current, config.adminPasswordHash)) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
  }

  await saveConfig({ ...config, adminPasswordHash: hashPassword(newPassword) })

  return NextResponse.json({ ok: true })
}
