import { computed, ref, watch } from 'vue'
import { ROLE_TEACHER, useAuthStore } from '@/modules/auth'
import { listRoleOptions } from '@/modules/role'
import { listUsers } from '@/modules/user'

/**
 * Guru aktif di sekolah (calon wali kelas), dimuat setelah sekolah diketahui (`ready`). Membutuhkan hak lihat menu `roles` dan `users`;
 * tanpa hak itu `available` bernilai false dan form menonaktifkan pilihan wali kelas.
 */
export function useTeacherOptions(scopeId, ready) {
  const auth = useAuthStore()
  const available = computed(() => auth.can('roles') && auth.can('users'))
  const teachers = ref([])
  const loading = ref(false)

  async function load() {
    if (!available.value || !ready.value) {
      teachers.value = []
      return
    }
    loading.value = true
    try {
      const roles = await listRoleOptions(scopeId.value)
      const teacherRole = roles.find((role) => role.code === ROLE_TEACHER)
      if (!teacherRole) {
        teachers.value = []
        return
      }
      const { items } = await listUsers({
        roleId: teacherRole.id,
        schoolId: scopeId.value,
        isActive: true,
        limit: 100,
      })
      teachers.value = items.map((user) => ({
        value: user.id,
        label: user.name,
        username: user.username,
      }))
    } catch {
      teachers.value = []
    } finally {
      loading.value = false
    }
  }

  watch([scopeId, ready], load, { immediate: true })

  return { teachers, loading, available, reload: load }
}
