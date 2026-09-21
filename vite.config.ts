import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), mkcert({ hosts: ['whoscues', 'localhost', '127.0.0.1'] })],
  server: {
    port: 5173,
    host: true,
    https: {},
    allowedHosts: ['whoscues', 'localhost'],
  },
})
