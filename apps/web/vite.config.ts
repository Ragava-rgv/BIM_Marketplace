import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@machinebazaar/shared'],
  },
  server: {
    proxy: {
      // Explicit 127.0.0.1, not 'localhost' — on this machine 'localhost' can resolve to
      // another unrelated project's dev server squatting on the IPv6 side of :3001, silently
      // misrouting every API/media request to the wrong backend.
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
