import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/utils/storage'
import * as authApi from '../api/auth.api'
import { REFRESH_TOKEN_KEY, useAuthStore } from '../stores/auth.store'

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  refresh: vi.fn(),
  me: vi.fn(),
  changePassword: vi.fn(),
}))

const USER = { id: 'u-1', name: 'Admin', email: 'admin@example.com', role: 'admin', isActive: true }
const TOKENS = { accessToken: 'access-1', refreshToken: 'refresh-1' }

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('login sukses menyimpan sesi: access token di memori, refresh token di storage', async () => {
    authApi.login.mockResolvedValue(TOKENS)
    authApi.me.mockResolvedValue(USER)
    const auth = useAuthStore()

    await auth.login({ email: 'admin@example.com', password: 'rahasia123' })

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'rahasia123',
    })
    expect(auth.accessToken).toBe('access-1')
    expect(auth.user).toEqual(USER)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.role).toBe('admin')
    expect(storage.get(REFRESH_TOKEN_KEY)).toBe('refresh-1')
    // Access token tidak pernah ditulis ke storage.
    expect(JSON.stringify({ ...localStorage })).not.toContain('access-1')
  })

  it('login gagal tidak meninggalkan sesi', async () => {
    authApi.login.mockRejectedValue(
      Object.assign(new Error('Email atau password salah'), { status: 401 }),
    )
    const auth = useAuthStore()

    await expect(auth.login({ email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'Email atau password salah',
    )
    expect(auth.isAuthenticated).toBe(false)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('logout membersihkan sesi', async () => {
    authApi.login.mockResolvedValue(TOKENS)
    authApi.me.mockResolvedValue(USER)
    const auth = useAuthStore()
    await auth.login({ email: 'admin@example.com', password: 'rahasia123' })

    auth.logout()

    expect(auth.user).toBeNull()
    expect(auth.accessToken).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('loadSession tanpa refresh token: tidak memanggil API dan menandai initialized', async () => {
    const auth = useAuthStore()

    await auth.loadSession()

    expect(authApi.refresh).not.toHaveBeenCalled()
    expect(authApi.me).not.toHaveBeenCalled()
    expect(auth.initialized).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('loadSession dengan refresh token: memulihkan sesi', async () => {
    storage.set(REFRESH_TOKEN_KEY, 'refresh-lama')
    authApi.refresh.mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    authApi.me.mockResolvedValue(USER)
    const auth = useAuthStore()

    await Promise.all([auth.loadSession(), auth.loadSession()])

    expect(authApi.refresh).toHaveBeenCalledTimes(1)
    expect(authApi.refresh).toHaveBeenCalledWith('refresh-lama')
    expect(auth.isAuthenticated).toBe(true)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBe('refresh-2')
  })

  it('loadSession dengan refresh token kedaluwarsa: sesi dibersihkan', async () => {
    storage.set(REFRESH_TOKEN_KEY, 'refresh-basi')
    authApi.refresh.mockRejectedValue(new Error('Refresh token tidak valid'))
    const auth = useAuthStore()

    await auth.loadSession()

    expect(auth.initialized).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBeNull()
  })
})
