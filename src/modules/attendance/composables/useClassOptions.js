import { computed, ref, watch } from 'vue'
import { useAcademicCalendar } from '@/modules/academic'
import { useAuthStore } from '@/modules/auth'
import { listClassOptions } from '@/modules/classroom'

/**
 * Kelas pada tahun pelajaran semester aktif untuk filter presensi.
 * `homeroomOnly`: guru tanpa hak data presensi hanya melihat kelas perwaliannya (backend juga
 * menolak kelas lain dengan 403).
 */
export function useClassOptions(school, { homeroomOnly = () => false } = {}) {
  const auth = useAuthStore()
  const calendar = useAcademicCalendar(school.scopeId, school.ready)
  const classes = ref([])
  const loading = ref(false)

  const yearId = computed(() => calendar.activeSemester.value?.academicYearId ?? null)

  watch(
    [yearId, school.scopeId],
    async ([academicYearId]) => {
      if (!academicYearId || !auth.can('classes')) {
        classes.value = []
        return
      }
      loading.value = true
      try {
        classes.value = await listClassOptions({ schoolId: school.scopeId.value, academicYearId })
      } catch {
        classes.value = []
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  const options = computed(() =>
    classes.value
      .filter((c) => !homeroomOnly() || c.homeroomUserId === auth.user?.id)
      .map((c) => ({ value: c.id, label: c.name, gradeLevel: c.gradeLevel })),
  )

  return { options, loading, calendar }
}
