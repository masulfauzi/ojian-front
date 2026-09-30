import { ROLE_SUPER_ADMIN } from '@/modules/auth'

/**
 * Role yang boleh diberikan ke user, mengikuti aturan backend:
 * - user tanpa sekolah (pengguna platform) hanya boleh berrole super_admin;
 * - user sekolah boleh role sistem selain super_admin dan role kustom sekolahnya.
 */
export function assignableRoles(roles, schoolId) {
  return schoolId
    ? roles.filter(
        (role) => role.code !== ROLE_SUPER_ADMIN && (!role.schoolId || role.schoolId === schoolId),
      )
    : roles.filter((role) => role.code === ROLE_SUPER_ADMIN)
}

/** Buang pilihan role yang tidak lagi tersedia (mis. setelah sekolah diganti). */
export function keepAvailable(roleIds, roles) {
  const available = new Set(roles.map((role) => role.id))
  return (roleIds ?? []).filter((id) => available.has(id))
}
