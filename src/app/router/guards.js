import { useAuthStore } from '@/modules/auth'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Exam Web'

/** Periksa apakah role user termasuk dalam `meta.roles` route (tanpa `roles` = semua role). */
export function hasRoleAccess(route, role) {
  const roles = route.meta?.roles
  return !roles?.length || roles.includes(role)
}

export function installGuards(router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    // Pulihkan sesi dari refresh token sebelum navigasi pertama selesai.
    if (!auth.initialized) await auth.loadSession()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'dashboard' }
    }
    if (to.meta.requiresAuth && !hasRoleAccess(to, auth.role)) {
      return { name: 'forbidden', replace: true }
    }
    return true
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
  })
}
