import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface Config {
  url?: string
  title?: string
  updatedAt?: string
  adminPasswordHash?: string
}

export type VideoConfig = Required<Pick<Config, 'url' | 'title' | 'updatedAt'>>

const LOCAL_FILE = join(process.cwd(), '.video-config.json')
const BLOB_KEY = 'config/karavision-config.json'

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getConfig(): Promise<Config> {
  if (hasBlob()) {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: 'config/' })
    const blob = blobs.find((b) => b.pathname === BLOB_KEY)
    if (!blob) return {}
    const res = await fetch(blob.url + '?_=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return {}
    return res.json()
  }
  if (!existsSync(LOCAL_FILE)) return {}
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export async function saveConfig(config: Config): Promise<void> {
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

export async function getVideoConfig(): Promise<VideoConfig | null> {
  const c = await getConfig()
  if (!c.url) return null
  return { url: c.url, title: c.title ?? '', updatedAt: c.updatedAt ?? '' }
}

export async function setVideoConfig(video: VideoConfig): Promise<void> {
  const current = await getConfig()
  await saveConfig({ ...current, ...video })
}
