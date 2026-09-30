import { ROLE_SCHOOL_ADMIN, ROLE_STUDENT, ROLE_SUPER_ADMIN } from '@/modules/auth'

// NISN: Nomor Induk Siswa Nasional, 10 digit. Dipakai sebagai username siswa.
export const NISN_PATTERN = /^[0-9]{10}$/

const ADMIN_ROLE_CODES = [ROLE_SUPER_ADMIN, ROLE_SCHOOL_ADMIN]

/** Apakah role yang dipilih memuat role admin (admin login dengan email). */
export const hasAdminRole = (roleCodes = []) =>
  roleCodes.some((code) => ADMIN_ROLE_CODES.includes(code))

/** Apakah role yang dipilih memuat role siswa (siswa login dengan NISN). */
export const hasStudentRole = (roleCodes = []) => roleCodes.includes(ROLE_STUDENT)

/**
 * Aturan identitas login, sama dengan `checkLoginIdentity` di backend. Hanya kode role sistem
 * yang dihitung (role kustom sekolah tidak ikut):
 * - siswa wajib memakai NISN 10 digit sebagai username;
 * - admin (super_admin, school_admin) wajib punya email.
 *
 * @returns {{ username?: string, email?: string }} pesan error per field
 */
export function loginIdentityIssues({ roleCodes = [], username = '', email = null }) {
  const issues = {}
  if (hasStudentRole(roleCodes) && !NISN_PATTERN.test(username ?? '')) {
    issues.username = 'siswa wajib memakai NISN 10 digit'
  }
  if (hasAdminRole(roleCodes) && !email) {
    issues.email = 'wajib diisi untuk admin (admin login dengan email)'
  }
  return issues
}

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
