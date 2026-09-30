import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import { createAppRouter } from '../index'

// Hindari request sungguhan saat guard memanggil loadSession.
vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn() } }
})

function loginAs(role) {
  const auth = useAuthStore()
  auth.accessToken = 'token'
  auth.user = { id: '1', name: 'Tester', role }
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
      expect.arrayContaining(['login', 'profile', 'dashboard', 'users', 'forbidden', 'not-found']),
    )
  })

  it('"/" diarahkan ke dashboard', () => {
    expect(router.resolve('/').matched[0].redirect).toEqual({ name: 'dashboard' })
  })

  it('route requiresAuth tanpa sesi → /login?redirect=...', async () => {
    await router.push('/users?page=2')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/users?page=2')
  })

  it('user yang sudah login membuka /login → dashboard', async () => {
    loginAs('student')
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('role tidak cocok → halaman 403', async () => {
    loginAs('student')
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('admin dapat membuka /users dan document.title diperbarui', async () => {
    loginAs('admin')
    await router.push('/users')
    expect(router.currentRoute.value.name).toBe('users')
    expect(document.title).toMatch(/^Manajemen User/)
  })

  it('path tidak dikenal → 404', async () => {
    await router.push('/tidak-ada')
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
