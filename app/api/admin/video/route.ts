import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { getConfig, saveConfig, setVideoConfig } from '@/lib/storage'

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  return !!token && verifySessionToken(token)
}

export async function HEAD(req: NextRequest) {
  if (!isAuthenticated(req)) return new Response(null, { status: 401 })
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

  // Delete from Supabase Storage if the file is hosted there
  const supabaseUrl = process.env.SUPABASE_URL
  if (config.url && supabaseUrl && config.url.startsWith(supabaseUrl)) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const path = config.url.split('/storage/v1/object/public/videos/')[1]
      if (path) await supabaseAdmin().storage.from('videos').remove([path])
    } catch {
      // Non-blocking
    }
  }

  const { url: _u, title: _t, updatedAt: _d, ...rest } = config
  await saveConfig(rest)
  return NextResponse.json({ ok: true })
}
