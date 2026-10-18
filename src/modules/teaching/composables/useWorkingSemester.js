import { computed, watch } from 'vue'
import { storage } from '@/shared/utils/storage'
import { useAcademicCalendar } from '@/modules/academic'

const KEY = 'teaching_semester'

/**
 * Semester kerja jurnal/jadwal mengajar. Server tidak menyimpan pilihan semester, jadi frontend
 * mengingatnya: query `semester` (bisa dibagikan) → pilihan terakhir per sekolah → semester aktif.
 *
 *   const { query, update } = useQueryState({ semester: { type: 'string' }, ... })
 *   const semester = useWorkingSemester({ query, update, school })
 *   api.list({ semesterId: semester.id.value })
 */
export function useWorkingSemester({ query, update, school }) {
  const calendar = useAcademicCalendar(school.scopeId, school.ready)
  const storeKey = () => `${KEY}:${school.schoolId.value ?? ''}`

  const known = (id) => calendar.semesters.value.some((s) => s.id === id)
  const id = computed(() => {
    const fromQuery = query.value.semester
    if (fromQuery && (!calendar.semesters.value.length || known(fromQuery))) return fromQuery
    const remembered = storage.get(storeKey())
    if (remembered && known(remembered)) return remembered
    return calendar.activeSemester.value?.id ?? null
  })
  const current = computed(() => calendar.semesterOf(id.value))
  const isActive = computed(() => Boolean(current.value?.isActive))
  const ready = computed(() => school.ready.value && !calendar.loading.value && Boolean(id.value))
  const options = computed(() =>
    calendar.semesters.value.map((s) => ({ value: s.id, label: s.label })),
  )

  function select(value) {
    if (value) storage.set(storeKey(), value)
    const active = calendar.activeSemester.value?.id
    update({ semester: value === active ? '' : value, page: 1 })
  }

  // Semester di query tidak dikenal (mis. sekolah berganti): kembali ke default.
  watch(
    () => calendar.semesters.value,
    (list) => {
      if (list.length && query.value.semester && !known(query.value.semester))
        update({ semester: '' })
    },
  )

  return { id, current, isActive, ready, options, select, calendar }
}
