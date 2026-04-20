import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Karavision',
  description: 'Lecteur vidéo 4K — Karavision',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
