export type VideoKind = 'youtube' | 'vimeo' | 'direct'

export function detectVideoKind(url: string): VideoKind {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/vimeo\.com/.test(url)) return 'vimeo'
  return 'direct'
}

export function getYoutubeId(url: string): string {
  return (
    url.match(/[?&]v=([^&]+)/)?.[1] ??
    url.match(/youtu\.be\/([^?]+)/)?.[1] ??
    url.match(/youtube\.com\/embed\/([^?]+)/)?.[1] ??
    ''
  )
}

export function toEmbedUrl(url: string, kind: VideoKind): string {
  if (kind === 'youtube') {
    return `https://www.youtube.com/embed/${getYoutubeId(url)}?rel=0&modestbranding=1&color=white`
  }
  if (kind === 'vimeo') {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1] ?? ''
    return `https://player.vimeo.com/video/${id}?color=e0c97f&title=0&byline=0`
  }
  return url
}
