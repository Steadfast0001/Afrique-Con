import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/campay-collect': {
        target: 'https://demo.campay.net/api/collect/',
        changeOrigin: true,
        rewrite: () => '',
      },
      '/api/campay-status': {
        target: 'https://demo.campay.net/api/transaction',
        changeOrigin: true,
        rewrite: (path) => {
          // extract the ref query param and rewrite to /ref/
          const parts = path.split('ref=');
          const ref = parts[1] ? parts[1].split('&')[0] : '';
          return `/${ref}/`;
        }
      }
    },
  },
})
