import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

export default defineConfig({
  plugins: [react()],
  base: '/aeroradar/', // <--- Percorso base per GitHub Pages
  server: {
    port: 5173,
    proxy: {
      '/api-adsb': {
        target: 'https://opendata.adsb.fi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-adsb/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      }
    }
  }
})