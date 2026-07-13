import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/campay': {
        target: 'https://demo.campay.net/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/campay/, ''),
      },
    },
  },
})
