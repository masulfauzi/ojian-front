import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/shared/utils/storage'
import * as authApi from '../api/auth.api'

export const REFRESH_TOKEN_KEY = 'refresh_token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  // Access token hanya di memori; refresh token di localStorage.
  const accessToken = ref(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const role = computed(() => user.value?.role ?? null)

  function setTokens({ accessToken: access, refreshToken }) {
    accessToken.value = access
    if (refreshToken) storage.set(REFRESH_TOKEN_KEY, refreshToken)
  }

  function clearSession() {
    user.value = null
    accessToken.value = null
    storage.remove(REFRESH_TOKEN_KEY)
  }

  async function login(credentials) {
    const tokens = await authApi.login(credentials)
    setTokens(tokens)
    try {
      user.value = await authApi.me()
    } catch (error) {
      clearSession()
      throw error
    }
    initialized.value = true
    return user.value
  }

  /** Tukar refresh token dengan pasangan token baru. Melempar error bila gagal. */
  async function refresh() {
    const refreshToken = storage.get(REFRESH_TOKEN_KEY)
    if (!refreshToken) throw new Error('Refresh token tidak tersedia')
    const tokens = await authApi.refresh(refreshToken)
    setTokens(tokens)
    return tokens
  }

  let loadingSession = null

  /**
   * Dipanggil sekali saat aplikasi dimuat: pulihkan sesi dari refresh token (bila ada),
   * lalu ambil data user. Aman dipanggil berkali-kali; panggilan bersamaan berbagi promise.
   */
  function loadSession() {
    if (initialized.value) return Promise.resolve()
    if (!loadingSession) {
      loadingSession = (async () => {
        try {
          if (storage.get(REFRESH_TOKEN_KEY)) {
            await refresh()
            user.value = await authApi.me()
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

  /** Backend belum punya endpoint logout; cukup bersihkan sesi lokal. */
  function logout() {
    clearSession()
  }

  async function fetchMe() {
    user.value = await authApi.me()
    return user.value
  }

  function changePassword(payload) {
    return authApi.changePassword(payload)
  }

  return {
    user,
    accessToken,
    initialized,
    isAuthenticated,
    role,
    login,
    logout,
    refresh,
    loadSession,
    fetchMe,
    changePassword,
    clearSession,
  }
})
