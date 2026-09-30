import { computed } from 'vue'
import { ACTIONS } from '@/shared/constants/permissions'
import { useAuthStore } from '../stores/auth.store'

/**
 * Hak akses role aktif untuk satu kode menu, untuk menampilkan/menyembunyikan tombol.
 *
 *   const can = useCan('users')
 *   <Button v-if="can.create" ... />
 *
 * Catatan: ini hanya tampilan. Keamanan sebenarnya tetap diperiksa backend.
 */
export function useCan(code) {
  const auth = useAuthStore()
  return computed(() =>
    Object.fromEntries(ACTIONS.map((action) => [action, auth.can(code, action)])),
  )
}
