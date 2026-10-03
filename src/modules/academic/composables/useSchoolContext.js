import { computed } from 'vue'
import { storage } from '@/shared/utils/storage'
import { useAuthStore } from '@/modules/auth'

const LAST_SCHOOL_KEY = 'academic_school_id'

/**
 * Sekolah yang sedang dikelola di halaman akademik.
 *
 * - Pengguna sekolah: sekolahnya sendiri; `school_id` tidak perlu dikirim ke API.
 * - Pengguna platform (super admin): memilih sekolah, disimpan di query `school_id` (bagian dari
 *   `useQueryState` halaman) dan diingat agar tetap terpilih saat pindah halaman akademik.
 *
 *   const { query, update } = useQueryState({ school_id: { type: 'string' }, ... })
 *   const school = useSchoolContext({ query, update })
 *   api.list({ schoolId: school.scopeId.value })
 */
export function useSchoolContext({ query, update }) {
  const auth = useAuthStore()
  const isPlatform = computed(() => auth.isPlatformUser)

  const schoolId = computed(() =>
    isPlatform.value ? query.value.school_id || null : (auth.user?.school?.id ?? null),
  )
  /** Nilai `school_id` untuk API: hanya untuk pengguna platform. */
  const scopeId = computed(() => (isPlatform.value ? schoolId.value : null))
  const ready = computed(() => Boolean(schoolId.value))

  function setSchool(id) {
    if (id) storage.set(LAST_SCHOOL_KEY, id)
    else storage.remove(LAST_SCHOOL_KEY)
    update({ school_id: id ?? '', page: 1 })
  }

  // Pulihkan sekolah terakhir yang dipilih super admin.
  if (isPlatform.value && !query.value.school_id) {
    const last = storage.get(LAST_SCHOOL_KEY)
    if (last) update({ school_id: last })
  }

  return { schoolId, scopeId, ready, isPlatform, setSchool }
}
