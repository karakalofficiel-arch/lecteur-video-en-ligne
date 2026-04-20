'use client'

import { useEffect, useRef, useState } from 'react'
import { detectVideoKind, toEmbedUrl } from '@/lib/video'
import type { VideoConfig } from '@/lib/storage'

export default function KaravisionPage() {
  const [config, setConfig] = useState<VideoConfig | null | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [buffered, setBuffered] = useState(0)     // % buffered
  const [buffering, setBuffering] = useState(false) // spinner

  useEffect(() => {
    fetch('/api/video')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  // Track buffer progress for the indicator
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function updateBuffer() {
      if (!video || !video.buffered.length) return
      const end = video.buffered.end(video.buffered.length - 1)
      setBuffered(video.duration ? Math.round((end / video.duration) * 100) : 0)
    }

    video.addEventListener('progress', updateBuffer)
    video.addEventListener('waiting', () => setBuffering(true))
    video.addEventListener('playing', () => setBuffering(false))
    video.addEventListener('canplay', () => setBuffering(false))
    video.addEventListener('timeupdate', updateBuffer)

    return () => {
      video.removeEventListener('progress', updateBuffer)
      video.removeEventListener('timeupdate', updateBuffer)
    }
  }, [config])

  const kind = config ? detectVideoKind(config.url) : null
  const embedUrl = config && kind && kind !== 'direct' ? toEmbedUrl(config.url, kind) : null

  return (
    <main className="relative min-h-screen bg-kara-bg flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center px-8 py-6 pointer-events-none">
        <a
          href="/"
          className="pointer-events-auto text-kara-accent font-bold tracking-widest2 uppercase text-sm"
          style={{ letterSpacing: '0.4em' }}
        >
          KARAVISION
        </a>
      </header>

      {/* Player area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10 min-h-screen">
        {config === undefined ? (
          <Spinner />
        ) : config === null ? (
          <EmptyState />
        ) : (
          <div className="w-full max-w-[1800px] flex flex-col gap-4">
            {/* Video wrapper */}
            <div
              className="relative w-full overflow-hidden rounded-sm bg-black shadow-2xl"
              style={{ aspectRatio: '16/9' }}
            >
              {kind === 'direct' ? (
                <>
                  <video
                    ref={videoRef}
                    src={config.url}
                    controls
                    preload="auto"
                    playsInline
                    className="w-full h-full object-contain"
                    title={config.title}
                    // Allow browser to cache aggressively
                    crossOrigin="anonymous"
                  />

                  {/* Buffering spinner overlay */}
                  {buffering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <iframe
                  src={embedUrl!}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                  title={config.title}
                />
              )}
            </div>

            {/* Title + buffer bar */}
            <div className="flex flex-col gap-2 px-1">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-kara-text text-base font-medium leading-snug truncate">
                  {config.title}
                </h2>
                <span className="shrink-0 text-kara-muted text-xs">4K</span>
              </div>

              {/* Buffer indicator — only for direct files */}
              {kind === 'direct' && buffered > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-kara-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-kara-muted/60 rounded-full transition-all duration-500"
                      style={{ width: `${buffered}%` }}
                    />
                  </div>
                  <span className="text-kara-muted text-xs shrink-0">{buffered}% chargé</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-kara-muted text-xs tracking-widest uppercase">
        karavision
      </footer>
    </main>
  )
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-kara-muted border-t-kara-accent rounded-full animate-spin" />
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div className="w-20 h-20 rounded-full bg-kara-panel flex items-center justify-center">
        <svg className="w-8 h-8 text-kara-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
      </div>
      <p className="text-kara-muted text-sm">Aucune vidéo disponible.<br />Revenez bientôt.</p>
    </div>
  )
}
