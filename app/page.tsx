'use client'

import { useEffect, useRef, useState } from 'react'
import { detectVideoKind, toEmbedUrl } from '@/lib/video'
import type { VideoConfig } from '@/lib/storage'

export default function KaravisionPage() {
  const [config, setConfig] = useState<VideoConfig | null | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetch('/api/video')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  const kind = config ? detectVideoKind(config.url) : null
  const embedUrl = config && kind && kind !== 'direct' ? toEmbedUrl(config.url, kind) : null

  return (
    <main className="relative min-h-screen bg-kara-bg flex flex-col select-none">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 pointer-events-none">
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
          <div className="w-full max-w-[1600px] flex flex-col gap-4">
            {/* Video */}
            <div
              className="relative w-full overflow-hidden rounded-sm bg-black shadow-2xl"
              style={{ aspectRatio: '16/9' }}
            >
              {kind === 'direct' ? (
                <video
                  ref={videoRef}
                  src={config.url}
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain"
                  title={config.title}
                />
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

            {/* Title + meta */}
            <div className="flex items-start justify-between gap-4 px-1">
              <h2 className="text-kara-text text-lg font-medium leading-snug">
                {config.title}
              </h2>
              <span className="shrink-0 text-kara-muted text-xs mt-1">
                4K
              </span>
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
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-kara-muted border-t-kara-accent rounded-full animate-spin" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div className="w-20 h-20 rounded-full bg-kara-panel flex items-center justify-center">
        <svg
          className="w-8 h-8 text-kara-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
          />
        </svg>
      </div>
      <p className="text-kara-muted text-sm">
        Aucune vidéo disponible pour le moment.
        <br />
        Revenez bientôt.
      </p>
    </div>
  )
}
