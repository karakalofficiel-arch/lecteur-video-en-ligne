import { NextResponse } from 'next/server'
import { getVideoConfig } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = await getVideoConfig()
  if (!config) {
    return NextResponse.json(null)
  }
  return NextResponse.json(config)
}
