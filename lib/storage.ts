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

function hasSupabase() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function getConfig(): Promise<Config> {
  if (hasSupabase()) {
    const { supabaseAdmin } = await import('./supabase')
    const { data } = await supabaseAdmin()
      .from('karavision_config')
      .select('video_url, video_title, updated_at, admin_password_hash')
      .eq('id', 1)
      .single()
    if (!data) return {}
    return {
      url: data.video_url ?? undefined,
      title: data.video_title ?? undefined,
      updatedAt: data.updated_at ?? undefined,
      adminPasswordHash: data.admin_password_hash ?? undefined,
    }
  }

  if (!existsSync(LOCAL_FILE)) return {}
  try { return JSON.parse(readFileSync(LOCAL_FILE, 'utf-8')) }
  catch { return {} }
}

export async function saveConfig(config: Config): Promise<void> {
  if (hasSupabase()) {
    const { supabaseAdmin } = await import('./supabase')
    await supabaseAdmin()
      .from('karavision_config')
      .upsert({
        id: 1,
        video_url: config.url ?? null,
        video_title: config.title ?? null,
        updated_at: config.updatedAt ?? new Date().toISOString(),
        admin_password_hash: config.adminPasswordHash ?? null,
      }, { onConflict: 'id' })
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
