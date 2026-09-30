import { useAuthStore } from '@/modules/auth'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Exam Web'

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
    // Pulihkan sesi dari refresh token sebelum navigasi pertama selesai.
    if (!auth.initialized) await auth.loadSession()

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
  })
}
