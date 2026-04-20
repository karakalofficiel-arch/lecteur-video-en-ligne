'use client'

import { useEffect, useRef } from 'react'

// Minimal YT IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars?: Record<string, string | number>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  setPlaybackQuality(q: string): void
  getPlaybackQuality(): string
  destroy(): void
}

const QUALITY = 'hd2160' // 4K

export function YoutubePlayer({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
    if (!videoId) return

    function forceQuality(player: YTPlayer) {
      player.setPlaybackQuality(QUALITY)
    }

    function initPlayer() {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          // vq hint — not official but respected by some clients
          vq: QUALITY,
        },
        events: {
          onReady: (e) => forceQuality(e.target),
          onStateChange: (e) => {
            // Re-enforce on every play (YouTube may reset quality on seek/buffer)
            if (e.data === window.YT.PlayerState.PLAYING) {
              forceQuality(e.target)
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      // Queue init for when the script loads
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  // YouTube Player API replaces this div with an <iframe>
  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />
}
