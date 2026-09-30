import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as userApi from '../api/user.api'
import { useUserStore } from '../stores/user.store'

vi.mock('../api/user.api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))

const page = (items, meta = {}) => ({
  items,
  meta: { page: 1, limit: 10, total: items.length, totalPages: 1, ...meta },
})

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchUsers meneruskan filter dan menyimpan item serta meta', async () => {
    userApi.listUsers.mockResolvedValue(page([{ id: '1' }], { total: 21, totalPages: 3 }))
    const store = useUserStore()

    await store.fetchUsers({ page: 1, search: 'a', roleId: 'r1', isActive: true, schoolId: 's1' })

    expect(userApi.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        search: 'a',
        roleId: 'r1',
        isActive: true,
        schoolId: 's1',
      }),
    )
    expect(store.items).toHaveLength(1)
    expect(store.meta.total).toBe(21)
    expect(store.loading).toBe(false)
  })

  it('response lama tidak menimpa response yang lebih baru', async () => {
    let resolveSlow
    userApi.listUsers
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSlow = resolve)))
      .mockResolvedValueOnce(page([{ id: 'baru' }]))
    const store = useUserStore()

    const slow = store.fetchUsers({ search: 'b' })
    await store.fetchUsers({ search: 'bu' })
    resolveSlow(page([{ id: 'lama' }]))
    await slow

    expect(store.items.map((u) => u.id)).toEqual(['baru'])
  })

  it('updateUser mengganti item di daftar', async () => {
    userApi.listUsers.mockResolvedValue(page([{ id: '1', name: 'Lama' }]))
    userApi.updateUser.mockResolvedValue({ id: '1', name: 'Baru' })
    const store = useUserStore()
    await store.fetchUsers()

    await store.updateUser('1', { name: 'Baru' })

    expect(store.items[0].name).toBe('Baru')
  })

  it('deleteUser pada item terakhir di halaman > 1 mundur satu halaman', async () => {
    userApi.listUsers.mockResolvedValue(page([{ id: '11' }], { page: 2 }))
    userApi.deleteUser.mockResolvedValue()
    const store = useUserStore()
    await store.fetchUsers({ page: 2 })

    await store.deleteUser('11')

    expect(userApi.deleteUser).toHaveBeenCalledWith('11')
    expect(userApi.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    expect(store.lastQuery.page).toBe(1)
  })
})
