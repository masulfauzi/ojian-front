import { useAuthStore } from '@/modules/auth'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Mulang.id'
let defaultDescription = null

/** Rute publik murni (mis. landing): tampil tanpa menunggu pemulihan sesi. */
const isPublic = (route) => route.meta.requiresAuth === false && !route.meta.guestOnly

function setDescription(text) {
  const tag = document.querySelector('meta[name="description"]')
  if (!tag) return
  if (defaultDescription === null) defaultDescription = tag.getAttribute('content') ?? ''
  tag.setAttribute('content', text || defaultDescription)
}

/**
 * Apakah role aktif boleh membuka route. Route tanpa `meta.menuCode` (profil, 403, 404) terbuka
 * untuk semua; route dengan `menuCode` memerlukan hak `meta.action` (default `view`) pada menu itu.
 */
export function canAccessRoute(route, auth) {
  const code = route.meta?.menuCode
  return !code || auth.can(code, route.meta.action ?? 'view')
}

export function installGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    if (!auth.initialized) {
      // Rute publik tidak menunggu: sesi dipulihkan di latar belakang (tombol CTA menyesuaikan).
      if (isPublic(to)) {
        auth.loadSession()
        return true
      }
      // Pulihkan sesi dari refresh token sebelum navigasi pertama selesai.
      await auth.loadSession()
    }
    // Rute publik tetap terbuka untuk pengguna yang sudah login (tidak dialihkan).
    if (isPublic(to)) return true

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    // Akun dengan password awal dari admin wajib mengganti password lebih dulu.
    if (auth.isAuthenticated && auth.mustChangePassword && !to.meta.allowWhenMustChange) {
      return to.meta.guestOnly || to.meta.requiresAuth ? { name: 'change-password' } : true
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return auth.homeRoute()
    }
    if (to.meta.requiresAuth && !canAccessRoute(to, auth)) {
      return { name: 'forbidden', replace: true }
    }
    return true
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
    setDescription(to.meta.description)
  })
}
