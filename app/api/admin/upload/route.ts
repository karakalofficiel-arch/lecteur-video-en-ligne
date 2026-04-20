import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { filename, contentType } = await request.json().catch(() => ({}))
  if (!filename) return NextResponse.json({ error: 'filename requis' }, { status: 400 })

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${Date.now()}-${safeName}`

  const { data, error } = await supabaseAdmin()
    .storage
    .from('videos')
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erreur Supabase' }, { status: 500 })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/videos/${path}`

  return NextResponse.json({
    token: data.token,
    path,
    publicUrl,
    uploadUrl: `${supabaseUrl}/storage/v1/upload/resumable`,
  })
}
