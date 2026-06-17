/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Permite previsualizar el ruteo por host en local con lvh.me (resuelve a
    // 127.0.0.1): lvh.me=landing, <slug>.lvh.me=clínica, admin.lvh.me=plataforma.
    allowedHosts: ['.lvh.me'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
