import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface VideoConfig {
  url: string
  title: string
  updatedAt: string
}

const LOCAL_FILE = join(process.cwd(), '.video-config.json')
const BLOB_KEY = 'config/karavision-config.json'

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getVideoConfig(): Promise<VideoConfig | null> {
  if (hasBlob()) {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: 'config/' })
    const blob = blobs.find((b) => b.pathname === BLOB_KEY)
    if (!blob) return null
    const res = await fetch(blob.url + '?_=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  }

  if (!existsSync(LOCAL_FILE)) return null
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export async function setVideoConfig(config: VideoConfig): Promise<void> {
  if (hasBlob()) {
    const { put } = await import('@vercel/blob')
    await put(BLOB_KEY, JSON.stringify(config), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    return
  }

  writeFileSync(LOCAL_FILE, JSON.stringify(config, null, 2))
}
