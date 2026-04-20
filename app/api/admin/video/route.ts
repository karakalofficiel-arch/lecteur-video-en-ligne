import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { setVideoConfig } from '@/lib/storage'

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  return !!token && verifySessionToken(token)
}

export async function HEAD(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new Response(null, { status: 401 })
  }
  return new Response(null, { status: 200 })
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { url, title } = await req.json().catch(() => ({}))

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requise' }, { status: 400 })
  }

  await setVideoConfig({
    url: url.trim(),
    title: (title ?? '').trim() || 'Vidéo sans titre',
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
