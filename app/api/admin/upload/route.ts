import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  return !!token && verifySessionToken(token)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-m4v',
          'video/x-matroska',
        ],
        maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2 GB (requires Vercel Pro)
        cacheControlMaxAge: 365 * 24 * 60 * 60,  // 1 an — URLs immuables
      }),
      onUploadCompleted: async () => {
        // Intentionally empty — client updates config after upload
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
