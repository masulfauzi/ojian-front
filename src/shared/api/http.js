import axios from 'axios'
import { normalizeError } from './errors'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api/v1'

// Titik pemasangan untuk auth. `shared` tidak boleh mengenal modul auth, jadi fungsi-fungsi ini
// diisi dari luar oleh `app/bootstrap.js`.
const authHandlers = {
  /** @returns {string|null} */
  getAccessToken: () => null,
  /** Memperbarui token. Harus melempar error bila gagal. */
  refreshTokens: () => Promise.reject(new Error('refreshTokens belum dipasang')),
  /** Dipanggil sekali ketika refresh gagal: bersihkan sesi dan arahkan ke login. */
  onUnauthorized: () => {},
}

export function setAuthHandlers(handlers = {}) {
  Object.assign(authHandlers, handlers)
}

/**
 * Opsi tambahan per request (di luar opsi axios):
 * - `skipAuth`: jangan kirim header Authorization.
 * - `skipAuthRefresh`: jangan coba refresh token saat response 401 (login, refresh).
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  if (config.skipAuth) return config
  const token = authHandlers.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Ingat token yang dipakai agar bisa tahu apakah token sudah diganti request lain.
  config._sentToken = token ?? null
  return config
})

// Satu promise refresh bersama: bila beberapa request gagal 401 bersamaan, hanya satu
// request refresh yang dikirim dan semuanya menunggu hasil yang sama.
let refreshPromise = null

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = Promise.resolve()
      .then(() => authHandlers.refreshTokens())
      .catch((error) => {
        // Sekali per kegagalan refresh, berapa pun request yang menunggu.
        authHandlers.onUnauthorized()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config
    const canRefresh =
      error?.response?.status === 401 && config && !config.skipAuthRefresh && !config._retried

    if (!canRefresh) return Promise.reject(normalizeError(error))

    config._retried = true

    // Token sudah diganti oleh refresh lain selama request ini berjalan: cukup ulangi.
    const currentToken = authHandlers.getAccessToken()
    const tokenChanged = currentToken && currentToken !== config._sentToken

    if (!tokenChanged) {
      try {
        await refreshOnce()
      } catch {
        return Promise.reject(normalizeError(error))
      }
    }
    return http(config)
  },
)

/** Buka pembungkus `{ success, message, data }` dari backend. */
export const unwrap = (response) => response.data?.data

/** Untuk endpoint list: `{ items, meta: { page, limit, total, totalPages } }`. */
export function unwrapList(response) {
  const meta = response.data?.meta ?? {}
  return {
    items: response.data?.data ?? [],
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 10,
      total: meta.total ?? 0,
      totalPages: meta.total_pages ?? 0,
    },
  }
}
