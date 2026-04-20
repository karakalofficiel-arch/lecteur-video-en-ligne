import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        kara: {
          bg: '#080808',
          panel: '#111111',
          border: '#1e1e1e',
          accent: '#e0c97f',
          text: '#f0f0f0',
          muted: '#555555',
        },
      },
      letterSpacing: {
        widest2: '0.4em',
      },
    },
  },
  plugins: [],
}

export default config
