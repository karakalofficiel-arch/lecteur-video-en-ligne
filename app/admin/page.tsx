'use client'

import { useEffect, useState } from 'react'

type View = 'loading' | 'login' | 'dashboard'

interface VideoConfig {
  url: string
  title: string
  updatedAt: string
}

export default function AdminPage() {
  const [view, setView] = useState<View>('loading')
  const [config, setConfig] = useState<VideoConfig | null>(null)

  // Login form
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Video form
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Password change form
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [showPwdForm, setShowPwdForm] = useState(false)

  useEffect(() => {
    fetch('/api/admin/video', { method: 'HEAD' })
      .then(async (r) => {
        if (r.status === 401) { setState('login'); return }
        await loadCurrentVideo()
        setView('dashboard')
      })
      .catch(() => setView('login'))
  }, [])

  function setState(v: View) { setView(v) }

  async function loadCurrentVideo() {
    const r = await fetch('/api/video')
    const data = await r.json()
    setConfig(data)
    if (data) { setUrl(data.url); setTitle(data.title) }
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
      setView('dashboard')
    } else {
      setLoginError((await r.json()).error ?? 'Erreur')
    }
  }

  async function handleSaveVideo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaveMsg('')
    const r = await fetch('/api/admin/video', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    })
    setSaving(false)
    if (r.ok) { setSaveMsg('Vidéo mise à jour.'); await loadCurrentVideo() }
    else setSaveMsg('Erreur : ' + ((await r.json()).error ?? 'inconnue'))
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg('')
    if (newPwd !== confirmPwd) { setPwdMsg('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 6) { setPwdMsg('Minimum 6 caractères.'); return }
    setPwdSaving(true)
    const r = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: currentPwd, newPassword: newPwd }),
    })
    setPwdSaving(false)
    if (r.ok) {
      setPwdMsg('Mot de passe changé avec succès.')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setShowPwdForm(false)
    } else {
      setPwdMsg((await r.json()).error ?? 'Erreur')
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setView('login'); setPassword('')
  }

  return (
    <div className="min-h-screen bg-kara-bg flex flex-col">
      <header className="border-b border-kara-border px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-kara-accent font-bold uppercase text-sm" style={{ letterSpacing: '0.4em' }}>
            KARAVISION
          </span>
          <span className="ml-3 text-kara-muted text-xs uppercase tracking-widest">Admin</span>
        </div>
        {view === 'dashboard' && (
          <button onClick={handleLogout} className="text-kara-muted text-xs hover:text-kara-text transition-colors uppercase tracking-widest">
            Déconnexion
          </button>
        )}
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        {view === 'loading' && (
          <div className="flex items-center justify-center w-full h-40">
            <div className="w-6 h-6 border-2 border-kara-muted border-t-kara-accent rounded-full animate-spin" />
          </div>
        )}

        {view === 'login' && (
          <div className="w-full max-w-sm">
            <h1 className="text-kara-text text-2xl font-semibold mb-8">Connexion</h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-kara-muted text-xs uppercase tracking-widest">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus required
                  className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button type="submit" className="mt-2 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 transition-opacity uppercase tracking-widest">
                Se connecter
              </button>
            </form>
            <p className="mt-6 text-center">
              <a href="/" className="text-kara-muted text-xs hover:text-kara-text transition-colors">← Retour au lecteur</a>
            </p>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="w-full max-w-xl flex flex-col gap-10">

            {/* ── Vidéo ── */}
            <section>
              <h1 className="text-kara-text text-xl font-semibold mb-1">Vidéo en ligne</h1>
              <p className="text-kara-muted text-sm mb-6">
                Collez une URL MP4, YouTube ou Vimeo. Visible instantanément.
              </p>

              {config && (
                <div className="mb-6 p-4 rounded bg-kara-panel border border-kara-border text-sm">
                  <p className="text-kara-muted text-xs uppercase tracking-widest mb-2">Actuellement en ligne</p>
                  <p className="text-kara-text font-medium">{config.title}</p>
                  <p className="text-kara-muted text-xs mt-1 break-all">{config.url}</p>
                  <p className="text-kara-muted text-xs mt-2">
                    Mis à jour : {new Date(config.updatedAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}

              <form onSubmit={handleSaveVideo} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-kara-muted text-xs uppercase tracking-widest">URL de la vidéo *</label>
                  <input
                    type="url" value={url} onChange={(e) => setUrl(e.target.value)} required
                    placeholder="https://…"
                    className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-kara-muted text-xs uppercase tracking-widest">Titre</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de la vidéo"
                    className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                  />
                </div>
                {saveMsg && (
                  <p className={`text-sm ${saveMsg.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity uppercase tracking-widest">
                    {saving ? 'Enregistrement…' : 'Mettre en ligne'}
                  </button>
                  <a href="/" target="_blank"
                    className="px-5 py-3 border border-kara-border rounded text-kara-muted text-sm hover:text-kara-text hover:border-kara-text transition-colors flex items-center">
                    Voir ↗
                  </a>
                </div>
              </form>
            </section>

            {/* ── Mot de passe ── */}
            <section className="border-t border-kara-border pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-kara-text text-lg font-semibold">Mot de passe admin</h2>
                <button
                  onClick={() => { setShowPwdForm(!showPwdForm); setPwdMsg('') }}
                  className="text-kara-muted text-xs hover:text-kara-text transition-colors uppercase tracking-widest"
                >
                  {showPwdForm ? 'Annuler' : 'Modifier'}
                </button>
              </div>

              {showPwdForm && (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">Mot de passe actuel</label>
                    <input
                      type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
                      required autoFocus
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">Nouveau mot de passe</label>
                    <input
                      type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                      required minLength={6}
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">Confirmer</label>
                    <input
                      type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                      required
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  {pwdMsg && (
                    <p className={`text-sm ${pwdMsg.includes('succès') ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg}</p>
                  )}
                  <button type="submit" disabled={pwdSaving}
                    className="bg-kara-panel border border-kara-border text-kara-text font-semibold py-3 rounded text-sm hover:border-kara-accent disabled:opacity-50 transition-colors uppercase tracking-widest">
                    {pwdSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
                  </button>
                </form>
              )}
            </section>

          </div>
        )}
      </main>
    </div>
  )
}
