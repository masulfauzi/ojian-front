import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as userApi from '../api/user.api'

export const DEFAULT_LIMIT = 10

export const useUserStore = defineStore('user', () => {
  const items = ref([])
  const meta = ref({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref(null)
  const lastQuery = ref({ page: 1, limit: DEFAULT_LIMIT, search: '', role: '' })

  // Nomor urut request agar response lama (mis. saat mengetik cepat) tidak menimpa yang baru.
  let requestSeq = 0

  async function fetchUsers(query = lastQuery.value) {
    const seq = ++requestSeq
    lastQuery.value = { ...lastQuery.value, ...query }
    loading.value = true
    error.value = null
    try {
      const result = await userApi.listUsers(lastQuery.value)
      if (seq !== requestSeq) return
      items.value = result.items
      meta.value = result.meta
    } catch (err) {
      if (seq !== requestSeq) return
      error.value = err
      throw err
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  const reload = () => fetchUsers(lastQuery.value)

  async function createUser(values) {
    const user = await userApi.createUser(values)
    await reload()
    return user
  }

  async function updateUser(id, values) {
    const user = await userApi.updateUser(id, values)
    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) items.value[index] = user
    return user
  }

  async function deleteUser(id) {
    await userApi.deleteUser(id)
    // Bila item terakhir di halaman ini dihapus, mundur satu halaman.
    const { page } = lastQuery.value
    if (items.value.length === 1 && page > 1) {
      await fetchUsers({ page: page - 1 })
    } else {
      await reload()
    }
  }

  return {
    items,
    meta,
    loading,
    error,
    lastQuery,
    fetchUsers,
    reload,
    createUser,
    updateUser,
    deleteUser,
  }
})
