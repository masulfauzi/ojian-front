import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/utils/storage'
import * as authApi from '../api/auth.api'
import { REFRESH_TOKEN_KEY, useAuthStore } from '../stores/auth.store'

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  refresh: vi.fn(),
  switchRole: vi.fn(),
  fetchMenus: vi.fn(),
  fetchPermissions: vi.fn(),
  changePassword: vi.fn(),
}))

const ROLE_ADMIN = { id: 'r-admin', code: 'school_admin', name: 'Admin Sekolah', isDefault: true }
const ROLE_TEACHER = { id: 'r-teacher', code: 'teacher', name: 'Guru', isDefault: false }
const USER = {
  id: 'u-1',
  name: 'Budi',
  username: 'budi',
  email: null,
  school: { id: 's-1', code: 'sman1', name: 'SMAN 1' },
  mustChangePassword: false,
}

const session = (overrides = {}) => ({
  tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' },
  user: USER,
  activeRole: ROLE_ADMIN,
  roles: [ROLE_ADMIN, ROLE_TEACHER],
  roleChanged: false,
  ...overrides,
})

const MENUS = [
  { id: 'm-dash', code: 'dashboard', type: 'page', path: '/dashboard', children: [] },
  {
    id: 'm-master',
    code: 'master',
    type: 'group',
    path: null,
    children: [{ id: 'm-users', code: 'users', type: 'page', path: '/users', children: [] }],
  },
]
const PERMS = {
  dashboard: { view: true, create: false, update: false, delete: false },
  users: { view: true, create: true, update: false, delete: false },
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    authApi.fetchMenus.mockResolvedValue(MENUS)
    authApi.fetchPermissions.mockResolvedValue(PERMS)
  })

  it('login menyimpan sesi, role, menu, dan hak akses', async () => {
    authApi.login.mockResolvedValue(session())
    const auth = useAuthStore()

    await auth.login({ login: 'budi', password: 'rahasia123', schoolCode: 'sman1' })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.accessToken).toBe('access-1')
    expect(auth.role).toBe('school_admin')
    expect(auth.hasMultipleRoles).toBe(true)
    expect(auth.isPlatformUser).toBe(false)
    expect(auth.menus).toEqual(MENUS)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBe('refresh-1')
    // Access token tidak pernah ditulis ke storage.
    expect(JSON.stringify({ ...localStorage })).not.toContain('access-1')
  })

  it('can() membaca hak akses per kode menu dan aksi', async () => {
    authApi.login.mockResolvedValue(session())
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })

    expect(auth.can('users')).toBe(true)
    expect(auth.can('users', 'create')).toBe(true)
    expect(auth.can('users', 'delete')).toBe(false)
    expect(auth.can('schools')).toBe(false)
  })

  it('homeRoute: dashboard bila boleh, selain itu halaman pertama di menu', async () => {
    authApi.login.mockResolvedValue(session())
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })
    expect(auth.homeRoute()).toEqual({ name: 'dashboard' })

    auth.permissions = { users: PERMS.users }
    auth.menus = [MENUS[1]]
    expect(auth.homeRoute()).toBe('/users')

    auth.menus = []
    expect(auth.homeRoute()).toEqual({ name: 'profile' })
  })

  it('login gagal memuat akses tidak meninggalkan sesi', async () => {
    authApi.login.mockResolvedValue(session())
    authApi.fetchMenus.mockRejectedValue(new Error('gagal'))
    const auth = useAuthStore()

    await expect(auth.login({ login: 'budi', password: 'x' })).rejects.toThrow('gagal')
    expect(auth.isAuthenticated).toBe(false)
    expect(storage.get(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('switchRole mengganti token dan memuat ulang menu serta hak akses', async () => {
    authApi.login.mockResolvedValue(session())
    authApi.switchRole.mockResolvedValue(
      session({
        tokens: { accessToken: 'access-2', refreshToken: 'refresh-2' },
        activeRole: ROLE_TEACHER,
      }),
    )
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })
    authApi.fetchPermissions.mockResolvedValue({ dashboard: PERMS.dashboard })

    await auth.switchRole('r-teacher')

    expect(authApi.switchRole).toHaveBeenCalledWith('r-teacher')
    expect(auth.role).toBe('teacher')
    expect(auth.accessToken).toBe('access-2')
    expect(storage.get(REFRESH_TOKEN_KEY)).toBe('refresh-2')
    expect(authApi.fetchPermissions).toHaveBeenCalledTimes(2)
    expect(auth.can('users')).toBe(false)
  })

  it('refresh dengan role_changed memuat ulang akses dan mengisi roleChangedNotice', async () => {
    authApi.login.mockResolvedValue(session({ activeRole: ROLE_TEACHER }))
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })
    authApi.refresh.mockResolvedValue(session({ roleChanged: true }))

    await auth.refresh()

    expect(auth.role).toBe('school_admin')
    expect(auth.roleChangedNotice?.role).toEqual(ROLE_ADMIN)
    expect(authApi.fetchMenus).toHaveBeenCalledTimes(2)
  })

  it('refresh biasa tidak memuat ulang akses', async () => {
    authApi.login.mockResolvedValue(session())
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })
    authApi.refresh.mockResolvedValue(session())

    await auth.refresh()

    expect(auth.roleChangedNotice).toBeNull()
    expect(authApi.fetchMenus).toHaveBeenCalledTimes(1)
  })

  it('logout membersihkan sesi', async () => {
    authApi.login.mockResolvedValue(session())
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })

    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.roles).toEqual([])
    expect(auth.permissions).toEqual({})
    expect(storage.get(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('loadSession tanpa refresh token: tidak memanggil API dan menandai initialized', async () => {
    const auth = useAuthStore()

    await auth.loadSession()

    expect(authApi.refresh).not.toHaveBeenCalled()
    expect(auth.initialized).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('loadSession dengan refresh token: memulihkan sesi dan akses (sekali untuk panggilan bersamaan)', async () => {
    storage.set(REFRESH_TOKEN_KEY, 'refresh-lama')
    authApi.refresh.mockResolvedValue(session())
    const auth = useAuthStore()

    await Promise.all([auth.loadSession(), auth.loadSession()])

    expect(authApi.refresh).toHaveBeenCalledTimes(1)
    expect(authApi.refresh).toHaveBeenCalledWith('refresh-lama')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.can('users')).toBe(true)
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

  it('changePassword mematikan flag mustChangePassword', async () => {
    authApi.login.mockResolvedValue(session({ user: { ...USER, mustChangePassword: true } }))
    authApi.changePassword.mockResolvedValue()
    const auth = useAuthStore()
    await auth.login({ login: 'budi', password: 'x' })
    expect(auth.mustChangePassword).toBe(true)

    await auth.changePassword({ oldPassword: 'x', newPassword: 'baru12345' })

    expect(auth.mustChangePassword).toBe(false)
  })
})
