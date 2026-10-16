import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      // Explicit 127.0.0.1, not 'localhost' — see frontend/vite.config.ts for why.
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
});
