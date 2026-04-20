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
const CONFIG_PATH = 'config/karavision-config.json'
const BUCKET = 'videos'

function hasSupabase() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function sb() {
  const { supabaseAdmin } = await import('./supabase')
  return supabaseAdmin()
}

export async function getConfig(): Promise<Config> {
  if (hasSupabase()) {
    const client = await sb()
    const { data, error } = await client.storage.from(BUCKET).download(CONFIG_PATH)
    if (error || !data) return {}
    try {
      return JSON.parse(await data.text())
    } catch {
      return {}
    }
  }
  if (!existsSync(LOCAL_FILE)) return {}
  try { return JSON.parse(readFileSync(LOCAL_FILE, 'utf-8')) }
  catch { return {} }
}

export async function saveConfig(config: Config): Promise<void> {
  if (hasSupabase()) {
    const client = await sb()
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' })
    await client.storage.from(BUCKET).upload(CONFIG_PATH, blob, { upsert: true })
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
