import { createRouter, createWebHistory } from 'vue-router'
import { installGuards } from './guards'
import { scrollBehavior } from './scroll'

// Kumpulkan route dari semua modul: src/modules/<nama>/routes.js (export default array).
// Menambah modul baru TIDAK perlu mengubah file ini.
const moduleRoutes = Object.values(
  import.meta.glob('../../modules/*/routes.js', { eager: true, import: 'default' }),
).flat()

// Urutan penting: layout `landing` (route `/`) didaftarkan lebih dulu agar `/` tidak cocok ke
// induk layout lain yang juga ber-path '/'.
const LAYOUTS = {
  landing: () => import('../layouts/LandingLayout.vue'),
  dashboard: () => import('../layouts/DashboardLayout.vue'),
  auth: () => import('../layouts/AuthLayout.vue'),
}

/**
 * Kelompokkan route berdasarkan `meta.layout` menjadi children dari route layout.
 * Route dengan layout lain (mis. `blank`) dan catch-all dipasang di level atas.
 */
export function buildRoutes(routes) {
  const byLayout = Object.fromEntries(Object.keys(LAYOUTS).map((name) => [name, []]))
  const topLevel = []
  const catchAll = []

  for (const route of routes) {
    const layout = route.meta?.layout
    if (route.path.includes('pathMatch')) catchAll.push(route)
    else if (byLayout[layout]) byLayout[layout].push(route)
    else topLevel.push(route)
  }

  const layoutRoute = (name) => ({ path: '/', component: LAYOUTS[name], children: byLayout[name] })
  const others = Object.keys(LAYOUTS)
    .filter((name) => name !== 'landing' && byLayout[name].length)
    .map(layoutRoute)
  // Harus paling awal: route layout lain juga ber-path '/', yang pertama didaftarkan menang.
  // Tanpa modul landing, `/` diarahkan ke dashboard seperti sebelumnya.
  const root = byLayout.landing.length
    ? [layoutRoute('landing')]
    : [{ path: '/', redirect: { name: 'dashboard' } }]

  return [...root, ...topLevel, ...others, ...catchAll]
}

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({
    history,
    routes: buildRoutes(moduleRoutes),
    scrollBehavior,
  })
  installGuards(router)
  return router
}
