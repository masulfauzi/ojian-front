import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const src = (path) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

/**
 * Tautan canonical landing dari `VITE_SITE_URL` (opsional). Disisipkan saat build/dev hanya
 * bila env diisi, agar index.html tidak memuat URL kosong.
 */
function canonicalLink(mode) {
  const siteUrl = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || '').trim()
  return {
    name: 'canonical-link',
    transformIndexHtml() {
      if (!/^https?:\/\//.test(siteUrl)) return []
      return [
        {
          tag: 'link',
          attrs: { rel: 'canonical', href: siteUrl.replace(/\/?$/, '/') },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:url', content: siteUrl.replace(/\/?$/, '/') },
          injectTo: 'head',
        },
      ]
    },
  }
}

/**
 * Landing (`/`) tetap chunk lazy terpisah, tetapi diunduh paralel dengan bundle utama lewat
 * `modulepreload` agar halaman publik pertama tidak menunggu dua gelombang permintaan.
 * Hanya saat build (dev tidak punya bundle).
 */
function preloadLanding() {
  const entry = /(?:landing\/views\/LandingPage|layouts\/LandingLayout)\.vue$/
  return {
    name: 'preload-landing',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return []
        const chunks = Object.values(ctx.bundle).filter(
          (c) => c.type === 'chunk' && entry.test(c.facadeModuleId ?? ''),
        )
        const css = chunks.flatMap((c) => [...(c.viteMetadata?.importedCss ?? [])])
        return [
          ...chunks.map((c) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: '', href: `/${c.fileName}` },
            injectTo: 'head',
          })),
          ...css.map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'style', href: `/${file}` },
            injectTo: 'head',
          })),
        ]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), canonicalLink(mode), preloadLanding()],
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
}))
