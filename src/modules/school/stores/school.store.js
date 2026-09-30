import { defineStore } from 'pinia'
import { usePagedList } from '@/shared/composables/usePagedList'
import * as schoolApi from '../api/school.api'

export const useSchoolStore = defineStore('school', () => {
  const list = usePagedList((query) => schoolApi.listSchools(query))

  async function createSchool(values) {
    const school = await schoolApi.createSchool(values)
    await list.reload()
    return school
  }

  async function updateSchool(id, values) {
    const school = await schoolApi.updateSchool(id, values)
    list.replaceItem(school)
    return school
  }

  async function deleteSchool(id) {
    await schoolApi.deleteSchool(id)
    await list.reloadAfterDelete()
  }

  return {
    items: list.items,
    meta: list.meta,
    loading: list.loading,
    lastQuery: list.lastQuery,
    fetchSchools: list.fetch,
    reload: list.reload,
    createSchool,
    updateSchool,
    deleteSchool,
  }
})
