import { setAuthHandlers } from '@/shared/api/http'
import { useAuthStore } from '@/modules/auth'

/**
 * Sambungkan http client (shared) dengan auth store (modul auth).
 * `shared` tidak mengenal modul, jadi ketergantungannya dibalik lewat handler.
 */
export function wireAuth({ pinia, router }) {
  const auth = useAuthStore(pinia)

  setAuthHandlers({
    getAccessToken: () => auth.accessToken,
    refreshTokens: () => auth.refresh(),
    onUnauthorized: () => {
      auth.clearSession()
      // Saat sesi sedang dipulihkan, guard yang akan mengarahkan ke login.
      if (!auth.initialized) return
      const current = router.currentRoute.value
      if (current.name === 'login') return
      router.replace({
        name: 'login',
        query: current.meta.requiresAuth ? { redirect: current.fullPath } : {},
      })
    },
  })
}
