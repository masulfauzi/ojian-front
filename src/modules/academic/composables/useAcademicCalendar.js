import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth'
import { getActiveSemester, listAcademicYears, listSemesters } from '../api/academic.api'
import { semesterLabel, yearsFromSemesters } from '../utils/dates'

/**
 * Tahun pelajaran dan semester sekolah (dimuat sekaligus, maks 100 tahun — cukup untuk
 * kebutuhan pemilih dan halaman pengelolaan).
 *
 * Pengguna tanpa hak lihat menu `academic_years` (mis. guru) tidak boleh memanggil
 * GET /academic-years; untuk mereka kalender disusun dari GET /semesters dan /semesters/active.
 *
 * @param {import('vue').Ref<string|null>} scopeId `school_id` untuk API (null untuk user sekolah)
 * @param {import('vue').Ref<boolean>} ready false selama super admin belum memilih sekolah
 */
export function useAcademicCalendar(scopeId, ready) {
  const auth = useAuthStore()
  const years = ref([])
  const loading = ref(false)
  const error = ref(null)
  let seq = 0

  async function reload() {
    const current = ++seq
    if (!ready.value) {
      years.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const schoolId = scopeId.value
      let items
      if (auth.can('academic_years')) {
        ;({ items } = await listAcademicYears({ schoolId, limit: 100 }))
      } else {
        const [semesters, active] = await Promise.all([
          listSemesters({ schoolId }),
          getActiveSemester({ schoolId }),
        ])
        items = yearsFromSemesters(semesters, active)
      }
      if (current === seq) years.value = items
    } catch (err) {
      if (current === seq) error.value = err
    } finally {
      if (current === seq) loading.value = false
    }
  }

  watch([scopeId, ready], reload, { immediate: true })

  /** Semua semester (terbaru lebih dulu) dengan nama tahun dan label siap tampil. */
  const semesters = computed(() =>
    years.value.flatMap((year) =>
      [...year.semesters].reverse().map((semester) => ({
        ...semester,
        yearName: year.name,
        label: `${semesterLabel(year.name, semester.termName)}${semester.isActive ? ' (aktif)' : ''}`,
      })),
    ),
  )

  const activeSemester = computed(() => semesters.value.find((s) => s.isActive) ?? null)
  const yearOf = (id) => years.value.find((year) => year.id === id) ?? null
  const semesterOf = (id) => semesters.value.find((s) => s.id === id) ?? null
  const semestersOfYear = (yearId) => semesters.value.filter((s) => s.academicYearId === yearId)

  return {
    years,
    semesters,
    activeSemester,
    loading,
    error,
    reload,
    yearOf,
    semesterOf,
    semestersOfYear,
  }
}
