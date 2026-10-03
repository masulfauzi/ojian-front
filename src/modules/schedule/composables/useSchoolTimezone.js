import { ref, watch } from 'vue'
import { DEFAULT_TIMEZONE } from '@/shared/constants/timezones'
import { listSchedules } from '../api/schedule.api'

/**
 * Zona waktu sekolah untuk form jadwal baru. Guru tidak berhak membaca data sekolah, jadi zona
 * diambil dari jadwal mana pun milik sekolah (respons jadwal selalu memuat `timezone`).
 * Sekolah tanpa jadwal → Asia/Jakarta (default backend). Jadwal yang sudah ada memakai
 * `schedule.timezone` langsung.
 */
export function useSchoolTimezone(scopeId, ready) {
  const timezone = ref(DEFAULT_TIMEZONE)
  const loaded = ref(false)

  watch(
    [scopeId, ready],
    async ([schoolId, isReady]) => {
      if (!isReady) return
      loaded.value = false
      try {
        const { items } = await listSchedules({ schoolId, limit: 1 })
        timezone.value = items[0]?.timezone ?? DEFAULT_TIMEZONE
      } catch {
        timezone.value = DEFAULT_TIMEZONE
      } finally {
        loaded.value = true
      }
    },
    { immediate: true },
  )

  return { timezone, loaded }
}
