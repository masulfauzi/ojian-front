import { defineStore } from 'pinia'
import { usePagedList } from '@/shared/composables/usePagedList'
import * as userApi from '../api/user.api'

export const useUserStore = defineStore('user', () => {
  const list = usePagedList((query) => userApi.listUsers(query))

  async function createUser(values) {
    const user = await userApi.createUser(values)
    await list.reload()
    return user
  }

  async function updateUser(id, values) {
    const user = await userApi.updateUser(id, values)
    list.replaceItem(user)
    return user
  }

  async function deleteUser(id) {
    await userApi.deleteUser(id)
    await list.reloadAfterDelete()
  }

  return {
    items: list.items,
    meta: list.meta,
    loading: list.loading,
    lastQuery: list.lastQuery,
    fetchUsers: list.fetch,
    reload: list.reload,
    createUser,
    updateUser,
    deleteUser,
  }
})
