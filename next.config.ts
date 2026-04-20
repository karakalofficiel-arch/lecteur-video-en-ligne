import type { NextConfig } from 'next'

const config: NextConfig = {
  // Allow video streaming from Vercel Blob
  async headers() {
    return [
      {
        source: '/api/video',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

export default config
