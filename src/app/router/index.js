import { createRouter, createWebHistory } from 'vue-router'
import { installGuards } from './guards'

// Kumpulkan route dari semua modul: src/modules/<nama>/routes.js (export default array).
// Menambah modul baru TIDAK perlu mengubah file ini.
const moduleRoutes = Object.values(
  import.meta.glob('../../modules/*/routes.js', { eager: true, import: 'default' }),
).flat()

const LAYOUTS = {
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

  return [
    // Harus paling awal: route layout di bawah juga ber-path '/', yang pertama didaftarkan menang.
    { path: '/', redirect: { name: 'dashboard' } },
    ...topLevel,
    ...Object.entries(byLayout)
      .filter(([, children]) => children.length)
      .map(([name, children]) => ({ path: '/', component: LAYOUTS[name], children })),
    ...catchAll,
  ]
}

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({
    history,
    routes: buildRoutes(moduleRoutes),
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  })
  installGuards(router)
  return router
}
