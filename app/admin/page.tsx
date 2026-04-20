'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

type View = 'loading' | 'login' | 'dashboard'
type UploadMode = 'file' | 'url'

interface VideoConfig {
  url: string
  title: string
  updatedAt: string
}

export default function AdminPage() {
  const [view, setView] = useState<View>('loading')
  const [config, setConfig] = useState<VideoConfig | null>(null)

  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password change
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/video', { method: 'HEAD' })
      .then(async (r) => {
        if (r.status === 401) { setView('login'); return }
        await loadCurrentVideo()
        setView('dashboard')
      })
      .catch(() => setView('login'))
  }, [])

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
    if (r.ok) { await loadCurrentVideo(); setView('dashboard') }
    else setLoginError((await r.json()).error ?? 'Erreur')
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setView('login'); setPassword('')
  }

  // ── File upload ──────────────────────────────────────────────────
  function pickFile(f: File) {
    setFile(f)
    setUploadMsg('')
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('video/')) pickFile(f)
  }, [title]) // eslint-disable-line

  async function handleUpload() {
    if (!file) return
    setUploading(true); setUploadProgress(0); setUploadMsg('')
    try {
      const blob = await upload(`videos/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      })
      // Save as current video
      await saveVideo(blob.url, title || file.name.replace(/\.[^.]+$/, ''))
      setFile(null); setUploadMsg('Vidéo mise en ligne avec succès.')
      await loadCurrentVideo()
    } catch (err) {
      setUploadMsg('Erreur : ' + (err instanceof Error ? err.message : 'inconnue'))
    } finally {
      setUploading(false); setUploadProgress(0)
    }
  }

  // ── URL save ──────────────────────────────────────────────────────
  async function handleSaveUrl(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaveMsg('')
    await saveVideo(url, title)
    setSaving(false)
    setSaveMsg('Vidéo mise à jour.')
    await loadCurrentVideo()
  }

  async function saveVideo(videoUrl: string, videoTitle: string) {
    const r = await fetch('/api/admin/video', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl, title: videoTitle }),
    })
    if (!r.ok) throw new Error((await r.json()).error ?? 'inconnue')
  }

  // ── Password change ───────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg('')
    if (newPwd !== confirmPwd) { setPwdMsg('Les mots de passe ne correspondent pas.'); return }
    setPwdSaving(true)
    const r = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: currentPwd, newPassword: newPwd }),
    })
    setPwdSaving(false)
    if (r.ok) {
      setPwdMsg('Mot de passe changé.')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwdForm(false)
    } else {
      setPwdMsg((await r.json()).error ?? 'Erreur')
    }
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-kara-bg flex flex-col">
      <header className="border-b border-kara-border px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-kara-accent font-bold uppercase text-sm" style={{ letterSpacing: '0.4em' }}>KARAVISION</span>
          <span className="ml-3 text-kara-muted text-xs uppercase tracking-widest">Admin</span>
        </div>
        {view === 'dashboard' && (
          <button onClick={handleLogout} className="text-kara-muted text-xs hover:text-kara-text transition-colors uppercase tracking-widest">
            Déconnexion
          </button>
        )}
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-16">

        {/* ── Loading ── */}
        {view === 'loading' && (
          <div className="flex items-center justify-center w-full h-40">
            <div className="w-6 h-6 border-2 border-kara-muted border-t-kara-accent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Login ── */}
        {view === 'login' && (
          <div className="w-full max-w-sm">
            <h1 className="text-kara-text text-2xl font-semibold mb-8">Connexion</h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-kara-muted text-xs uppercase tracking-widest">Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoFocus required placeholder="••••••••"
                  className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors" />
              </div>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button type="submit"
                className="mt-2 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 uppercase tracking-widest">
                Se connecter
              </button>
            </form>
            <p className="mt-6 text-center">
              <a href="/" className="text-kara-muted text-xs hover:text-kara-text transition-colors">← Retour au lecteur</a>
            </p>
          </div>
        )}

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <div className="w-full max-w-xl flex flex-col gap-10">

            {/* Current video info */}
            {config && (
              <div className="p-4 rounded bg-kara-panel border border-kara-border text-sm">
                <p className="text-kara-muted text-xs uppercase tracking-widest mb-2">Actuellement en ligne</p>
                <p className="text-kara-text font-medium">{config.title}</p>
                <p className="text-kara-muted text-xs mt-1 break-all">{config.url}</p>
                <p className="text-kara-muted text-xs mt-2">Mis à jour : {new Date(config.updatedAt).toLocaleString('fr-FR')}</p>
              </div>
            )}

            {/* Mode toggle */}
            <section>
              <h1 className="text-kara-text text-xl font-semibold mb-5">Mettre en ligne une vidéo</h1>
              <div className="flex gap-1 mb-6 bg-kara-panel border border-kara-border rounded p-1 w-fit">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`px-4 py-2 rounded text-xs uppercase tracking-widest transition-colors ${
                    uploadMode === 'file' ? 'bg-kara-accent text-black font-semibold' : 'text-kara-muted hover:text-kara-text'
                  }`}
                >
                  Fichier local
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`px-4 py-2 rounded text-xs uppercase tracking-widest transition-colors ${
                    uploadMode === 'url' ? 'bg-kara-accent text-black font-semibold' : 'text-kara-muted hover:text-kara-text'
                  }`}
                >
                  URL externe
                </button>
              </div>

              {/* ── File upload ── */}
              {uploadMode === 'file' && (
                <div className="flex flex-col gap-4">
                  {/* Drop zone */}
                  <div
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-kara-accent bg-kara-accent/5'
                        : file
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-kara-border hover:border-kara-muted'
                    }`}
                  >
                    <input
                      ref={fileInputRef} type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="text-kara-text text-sm font-medium">{file.name}</p>
                        <p className="text-kara-muted text-xs">{(file.size / 1024 / 1024).toFixed(1)} Mo — cliquer pour changer</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-kara-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        <div>
                          <p className="text-kara-text text-sm">Glisser une vidéo ici</p>
                          <p className="text-kara-muted text-xs mt-1">ou cliquer pour parcourir — MP4, WebM, MOV — max 500 Mo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">Titre</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la vidéo"
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors" />
                  </div>

                  {/* Progress bar */}
                  {uploading && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-kara-muted">
                        <span>Upload en cours…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-kara-panel rounded-full overflow-hidden">
                        <div
                          className="h-full bg-kara-accent transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadMsg && (
                    <p className={`text-sm ${uploadMsg.includes('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{uploadMsg}</p>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 disabled:opacity-40 transition-opacity uppercase tracking-widest"
                  >
                    {uploading ? `Upload ${uploadProgress}%…` : 'Uploader et mettre en ligne'}
                  </button>
                </div>
              )}

              {/* ── URL mode ── */}
              {uploadMode === 'url' && (
                <form onSubmit={handleSaveUrl} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">URL de la vidéo *</label>
                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://…"
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors" />
                    <p className="text-kara-muted text-xs">MP4/WebM direct, YouTube ou Vimeo</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-kara-muted text-xs uppercase tracking-widest">Titre</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la vidéo"
                      className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors" />
                  </div>
                  {saveMsg && <p className={`text-sm ${saveMsg.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-kara-accent text-black font-semibold py-3 rounded text-sm hover:opacity-90 disabled:opacity-50 uppercase tracking-widest">
                      {saving ? 'Enregistrement…' : 'Mettre en ligne'}
                    </button>
                    <a href="/" target="_blank"
                      className="px-5 py-3 border border-kara-border rounded text-kara-muted text-sm hover:text-kara-text transition-colors flex items-center">
                      Voir ↗
                    </a>
                  </div>
                </form>
              )}
            </section>

            {/* ── Password ── */}
            <section className="border-t border-kara-border pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-kara-text text-lg font-semibold">Mot de passe admin</h2>
                <button onClick={() => { setShowPwdForm(!showPwdForm); setPwdMsg('') }}
                  className="text-kara-muted text-xs hover:text-kara-text uppercase tracking-widest transition-colors">
                  {showPwdForm ? 'Annuler' : 'Modifier'}
                </button>
              </div>
              {showPwdForm && (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  {(['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer'] as const).map((label, i) => {
                    const vals = [currentPwd, newPwd, confirmPwd]
                    const setters = [setCurrentPwd, setNewPwd, setConfirmPwd]
                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <label className="text-kara-muted text-xs uppercase tracking-widest">{label}</label>
                        <input type="password" value={vals[i]} onChange={(e) => setters[i](e.target.value)}
                          required autoFocus={i === 0} minLength={i > 0 ? 6 : undefined}
                          placeholder={i > 0 ? 'Minimum 6 caractères' : '••••••••'}
                          className="bg-kara-panel border border-kara-border rounded px-4 py-3 text-kara-text text-sm focus:outline-none focus:border-kara-accent transition-colors" />
                      </div>
                    )
                  })}
                  {pwdMsg && <p className={`text-sm ${pwdMsg.includes('changé') ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg}</p>}
                  <button type="submit" disabled={pwdSaving}
                    className="bg-kara-panel border border-kara-border text-kara-text font-semibold py-3 rounded text-sm hover:border-kara-accent disabled:opacity-50 uppercase tracking-widest transition-colors">
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
