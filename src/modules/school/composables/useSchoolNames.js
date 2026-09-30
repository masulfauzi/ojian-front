import { reactive } from 'vue'
import { getSchool } from '../api/school.api'

// Cache nama sekolah per id, dipakai bersama semua komponen (satu request per sekolah).
const names = reactive({})
const pending = new Map()

/**
 * Tampilkan nama sekolah dari `school_id` (respons role/user hanya membawa id).
 *
 *   const schools = useSchoolNames()
 *   watch(items, (list) => schools.load(list.map((i) => i.schoolId)))
 *   schools.nameOf(item.schoolId)
 */
export function useSchoolNames() {
  function load(ids) {
    for (const id of new Set(ids.filter(Boolean))) {
      if (names[id] || pending.has(id)) continue
      pending.set(
        id,
        getSchool(id)
          .then((school) => (names[id] = school.name))
          .catch(() => (names[id] = '-'))
          .finally(() => pending.delete(id)),
      )
    }
  }

  const nameOf = (id) => (id ? (names[id] ?? '…') : null)

  return { load, nameOf }
}
