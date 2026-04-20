'use client'

import { useEffect, useState } from 'react'

type State = 'loading' | 'login' | 'dashboard'

interface VideoConfig {
  url: string
  title: string
  updatedAt: string
}

export default function AdminPage() {
  const [state, setState] = useState<State>('loading')
  const [config, setConfig] = useState<VideoConfig | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/admin/video', { method: 'HEAD' })
      .then(async (r) => {
        if (r.status === 401) {
          setState('login')
        } else {
          await loadCurrentVideo()
          setState('dashboard')
        }
      })
      .catch(() => setState('login'))
  }, [])

  async function loadCurrentVideo() {
    const r = await fetch('/api/video')
    const data = await r.json()
    setConfig(data)
    if (data) {
      setUrl(data.url)
      setTitle(data.title)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (r.ok) {
      await loadCurrentVideo()
      setState('dashboard')
    } else {
      const { error } = await r.json()
      setLoginError(error ?? 'Erreur')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const r = await fetch('/api/admin/video', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    })
    setSaving(false)
    if (r.ok) {
      setSaveMsg('Vidéo mise à jour avec succès.')
      await loadCurrentVideo()
    } else {
      const { error } = await r.json()
      setSaveMsg('Erreur : ' + (error ?? 'inconnue'))
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setState('login')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-kara-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-kara-border px-8 py-5 flex items-center justify-between">
        <div>
          <span
            className="text-kara-accent font-bold uppercase text-sm"
            style={{ letterSpacing: '0.4em' }}
          >
            KARAVISION
          </span>
          <span className="ml-3 text-kara-muted text-xs uppercase tracking-widest">
            Admin
          </span>
        </div>
        {state === 'dashboard' && (
          <button
            onClick={handleLogout}
            className="text-kara-muted text-xs hover:text-kara-text transition-colors uppercase tracking-widest"
          >
            Déconnexion
          </button>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        {state === 'loading' && (
          <div className="w-6 h-6 border-2 border-kara-muted border-t-kara-accent rounded-full animate-spin" />
        )}

        {state === 'login' && (
          <div className="w-full max-w-sm">
            <h1 className="text-kara-text text-2xl font-semibold mb-8">Connexion</h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-kara-muted text-xs uppercase tracking-widest">
                  Mot de passe administrateur
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <p className="text-red-400 text-sm">{loginError}</p>
              )}
              <button
                type="submit"
                className="mt-2 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 transition-opacity uppercase tracking-widest"
              >
                Se connecter
              </button>
            </form>
            <p className="mt-6 text-center">
              <a href="/" className="text-kara-muted text-xs hover:text-kara-text transition-colors">
                ← Retour au lecteur
              </a>
            </p>
          </div>
        )}

        {state === 'dashboard' && (
          <div className="w-full max-w-xl">
            <h1 className="text-kara-text text-2xl font-semibold mb-2">
              Vidéo en ligne
            </h1>
            <p className="text-kara-muted text-sm mb-8">
              Collez l'URL d'une vidéo MP4, YouTube ou Vimeo. Elle sera immédiatement visible sur la page principale.
            </p>

            {/* Current video preview */}
            {config && (
              <div className="mb-8 p-4 rounded bg-kara-panel border border-kara-border text-sm">
                <p className="text-kara-muted text-xs uppercase tracking-widest mb-2">
                  Actuellement en ligne
                </p>
                <p className="text-kara-text font-medium">{config.title}</p>
                <p className="text-kara-muted text-xs mt-1 break-all">{config.url}</p>
                <p className="text-kara-muted text-xs mt-2">
                  Mis à jour : {new Date(config.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-kara-muted text-xs uppercase tracking-widest">
                  URL de la vidéo *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://…"
                  className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                />
                <p className="text-kara-muted text-xs">
                  Supporte : fichiers MP4/WebM directs, YouTube, Vimeo
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-kara-muted text-xs uppercase tracking-widest">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de la vidéo"
                  className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                />
              </div>

              {saveMsg && (
                <p
                  className={`text-sm ${saveMsg.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}
                >
                  {saveMsg}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-widest"
                >
                  {saving ? 'Enregistrement…' : 'Mettre en ligne'}
                </button>
                <a
                  href="/"
                  target="_blank"
                  className="px-5 py-3 border border-kara-border rounded text-kara-muted text-sm hover:text-kara-text hover:border-kara-text transition-colors flex items-center gap-2"
                >
                  Voir le site ↗
                </a>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
