import { defineStore } from 'pinia'
import { usePagedList } from '@/shared/composables/usePagedList'
import * as roleApi from '../api/role.api'

export const useRoleStore = defineStore('role', () => {
  const list = usePagedList((query) => roleApi.listRoles(query))

  async function createRole(values) {
    const role = await roleApi.createRole(values)
    await list.reload()
    return role
  }

  async function updateRole(id, values) {
    const role = await roleApi.updateRole(id, values)
    list.replaceItem(role)
    return role
  }

  async function deleteRole(id) {
    await roleApi.deleteRole(id)
    await list.reloadAfterDelete()
  }

  return {
    items: list.items,
    meta: list.meta,
    loading: list.loading,
    lastQuery: list.lastQuery,
    fetchRoles: list.fetch,
    reload: list.reload,
    createRole,
    updateRole,
    deleteRole,
  }
})
