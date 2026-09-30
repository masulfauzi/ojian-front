import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const src = (path) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: src('') },
      // Komponen Chart PrimeVue memuat `chart.js/auto` yang mendaftarkan SEMUA controller.
      // Arahkan ke registri milik kita yang hanya mendaftarkan komponen yang dipakai.
      { find: /^chart\.js\/auto$/, replacement: src('shared/utils/chart.js') },
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/__tests__/**/*.test.js'],
    restoreMocks: true,
  },
})
