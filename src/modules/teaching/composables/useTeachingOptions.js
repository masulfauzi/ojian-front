import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth'
import { listClassOptions } from '@/modules/classroom'
import { listSubjectOptions } from '@/modules/subject'

/**
 * Pilihan kelas (tahun pelajaran semester kerja) dan mapel aktif untuk form jurnal/jadwal.
 * Hak lihat `classes`/`subjects` dimiliki guru dan admin; tanpa hak itu daftar kosong.
 */
export function useTeachingOptions(school, semester) {
  const auth = useAuthStore()
  const classes = ref([])
  const subjects = ref([])
  const loading = ref(false)

  const yearId = computed(() => semester.current.value?.academicYearId ?? null)

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

  watch(
    () => [school.ready.value, school.scopeId.value],
    async ([ready]) => {
      if (!ready || !auth.can('subjects')) return
      subjects.value = await listSubjectOptions({
        schoolId: school.scopeId.value,
        activeOnly: true,
      }).catch(() => [])
    },
    { immediate: true },
  )

  const classOptions = computed(() => classes.value.map((c) => ({ value: c.id, label: c.name })))
  const subjectOptions = computed(() => subjects.value.map((s) => ({ value: s.id, label: s.name })))

  return { classOptions, subjectOptions, loading }
}
