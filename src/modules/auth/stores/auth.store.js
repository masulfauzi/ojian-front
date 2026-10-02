import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/shared/utils/storage'
import { ACTION_VIEW } from '@/shared/constants/permissions'
import * as authApi from '../api/auth.api'

export const REFRESH_TOKEN_KEY = 'refresh_token'

/** Cari halaman pertama (type page) di pohon menu, urut sesuai tampilan sidebar. */
function firstPage(menus) {
  for (const menu of menus) {
    if (menu.type === 'page' && menu.path) return menu
    const child = firstPage(menu.children ?? [])
    if (child) return child
  }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  // Access token hanya di memori; refresh token di localStorage.
  const accessToken = ref(null)
  const activeRole = ref(null)
  const roles = ref([])
  // Pohon menu sidebar dan hak akses per kode menu untuk role aktif.
  const menus = ref([])
  const permissions = ref({})
  const initialized = ref(false)
  // Diisi saat refresh jatuh ke role default (role lama dicabut/nonaktif). Layout menampilkan toast.
  const roleChangedNotice = ref(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const role = computed(() => activeRole.value?.code ?? null)
  const isPlatformUser = computed(() => Boolean(user.value) && !user.value.school)
  const hasMultipleRoles = computed(() => roles.value.length > 1)
  const mustChangePassword = computed(() => Boolean(user.value?.mustChangePassword))

  /** Apakah role aktif punya hak `action` pada menu `code`. */
  function can(code, action = ACTION_VIEW) {
    return Boolean(permissions.value[code]?.[action])
  }

  /** Halaman awal setelah login atau saat route tidak boleh dibuka role aktif. */
  function homeRoute() {
    if (can('dashboard')) return { name: 'dashboard' }
    const page = firstPage(menus.value)
    return page ? page.path : { name: 'profile' }
  }

  function applySession(session) {
    if (session.tokens) {
      accessToken.value = session.tokens.accessToken
      if (session.tokens.refreshToken) storage.set(REFRESH_TOKEN_KEY, session.tokens.refreshToken)
    }
    user.value = session.user
    activeRole.value = session.activeRole
    roles.value = session.roles
  }

  /** Muat ulang menu sidebar dan hak akses role aktif. */
  async function loadAccess() {
    const [menuTree, perms] = await Promise.all([authApi.fetchMenus(), authApi.fetchPermissions()])
    menus.value = menuTree
    permissions.value = perms
  }

  function clearSession() {
    user.value = null
    accessToken.value = null
    activeRole.value = null
    roles.value = []
    menus.value = []
    permissions.value = {}
    storage.remove(REFRESH_TOKEN_KEY)
  }

  /**
   * Mulai sesi dari response auth (login atau registrasi sekolah): simpan token, user, dan role,
   * lalu muat menu serta hak akses. Bila akses gagal dimuat, sesi dibersihkan.
   */
  async function startSession(session) {
    applySession(session)
    try {
      await loadAccess()
    } catch (error) {
      clearSession()
      throw error
    }
    initialized.value = true
    return user.value
  }

  async function login(credentials) {
    return startSession(await authApi.login(credentials))
  }

  /** Tukar refresh token dengan pasangan token baru. Melempar error bila gagal. */
  async function refresh() {
    const refreshToken = storage.get(REFRESH_TOKEN_KEY)
    if (!refreshToken) throw new Error('Refresh token tidak tersedia')
    const previousRoleId = activeRole.value?.id
    const session = await authApi.refresh(refreshToken)
    applySession(session)
    if (session.roleChanged || (previousRoleId && previousRoleId !== session.activeRole?.id)) {
      await loadAccess()
      roleChangedNotice.value = { role: session.activeRole, at: Date.now() }
    }
    return session
  }

  let loadingSession = null

  /**
   * Dipanggil sekali saat aplikasi dimuat: pulihkan sesi dari refresh token (bila ada),
   * lalu muat menu dan hak akses. Panggilan bersamaan berbagi promise yang sama.
   */
  function loadSession() {
    if (initialized.value) return Promise.resolve()
    if (!loadingSession) {
      loadingSession = (async () => {
        try {
          const refreshToken = storage.get(REFRESH_TOKEN_KEY)
          if (refreshToken) {
            applySession(await authApi.refresh(refreshToken))
            await loadAccess()
          }
        } catch {
          clearSession()
        } finally {
          initialized.value = true
          loadingSession = null
        }
      })()
    }
    return loadingSession
  }

  /** Ganti role aktif, simpan token baru, lalu muat ulang menu dan hak akses. */
  async function switchRole(roleId) {
    applySession(await authApi.switchRole(roleId))
    await loadAccess()
    return activeRole.value
  }

  /** Backend belum punya endpoint logout; cukup bersihkan sesi lokal. */
  function logout() {
    clearSession()
  }

  async function changePassword(payload) {
    await authApi.changePassword(payload)
    if (user.value) user.value = { ...user.value, mustChangePassword: false }
  }

  return {
    user,
    accessToken,
    activeRole,
    roles,
    menus,
    permissions,
    initialized,
    roleChangedNotice,
    isAuthenticated,
    role,
    isPlatformUser,
    hasMultipleRoles,
    mustChangePassword,
    can,
    homeRoute,
    login,
    startSession,
    logout,
    refresh,
    loadSession,
    loadAccess,
    switchRole,
    changePassword,
    clearSession,
  }
})
