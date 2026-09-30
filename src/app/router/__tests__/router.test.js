import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import { createAppRouter } from '../index'

// Hindari request sungguhan (guard memanggil loadSession, halaman bisa memuat data).
vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  const pending = () => new Promise(() => {})
  return { ...actual, http: { get: vi.fn(pending), post: vi.fn(pending) } }
})

const full = { view: true, create: true, update: true, delete: true }
const viewOnly = { view: true, create: false, update: false, delete: false }

function loginWith(permissions, { mustChangePassword = false } = {}) {
  const auth = useAuthStore()
  auth.accessToken = 'token'
  auth.user = { id: '1', name: 'Tester', school: null, mustChangePassword }
  auth.activeRole = { id: 'r1', code: 'teacher', name: 'Guru' }
  auth.roles = [auth.activeRole]
  auth.permissions = permissions
  auth.menus = []
  auth.initialized = true
}

describe('router', () => {
  let router

  beforeEach(() => {
    window.scrollTo = vi.fn()
    setActivePinia(createPinia())
    localStorage.clear()
    router = createAppRouter(createMemoryHistory())
  })

  it('route dari modul terdaftar otomatis', () => {
    const names = router.getRoutes().map((r) => r.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'login',
        'change-password',
        'profile',
        'dashboard',
        'users',
        'schools',
        'roles',
        'role-permissions',
        'menus',
        'forbidden',
        'not-found',
      ]),
    )
  })

  it('route requiresAuth tanpa sesi → /login?redirect=...', async () => {
    await router.push('/users?page=2')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/users?page=2')
  })

  it('user yang sudah login membuka /login → halaman awal (dashboard)', async () => {
    loginWith({ dashboard: viewOnly })
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('tanpa hak lihat menu → 403', async () => {
    loginWith({ dashboard: viewOnly })
    await router.push('/schools')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('dengan hak lihat menu → halaman terbuka dan judul diperbarui', async () => {
    loginWith({ dashboard: viewOnly, users: full })
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('users')
    expect(document.title).toMatch(/^Pengguna/)
  })

  it('route tanpa menuCode (profil) terbuka untuk semua yang login', async () => {
    loginWith({})
    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('wajib ganti password: semua halaman diarahkan ke /change-password', async () => {
    loginWith({ dashboard: viewOnly, users: full }, { mustChangePassword: true })
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('change-password')
    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('change-password')
  })

  it('path tidak dikenal → 404', async () => {
    await router.push('/tidak-ada')
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
