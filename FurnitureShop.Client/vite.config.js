import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5028',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'http://localhost:5028',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5028',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
