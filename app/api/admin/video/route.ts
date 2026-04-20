import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { getConfig, saveConfig, setVideoConfig } from '@/lib/storage'

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

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const config = await getConfig()

  // If the video is stored on Vercel Blob, delete the file too
  if (config.url?.includes('vercel-storage.com') || config.url?.includes('blob.vercel')) {
    try {
      const { del } = await import('@vercel/blob')
      await del(config.url)
    } catch {
      // Non-blocking — config will be cleared regardless
    }
  }

  const { url: _url, title: _title, updatedAt: _updatedAt, ...rest } = config
  await saveConfig(rest)

  return NextResponse.json({ ok: true })
}
