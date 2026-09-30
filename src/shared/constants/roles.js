export const ROLE_ADMIN = 'admin'
export const ROLE_TEACHER = 'teacher'
export const ROLE_STUDENT = 'student'

export const ROLES = [ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT]

export const ROLE_LABELS = {
  [ROLE_ADMIN]: 'Admin',
  [ROLE_TEACHER]: 'Guru',
  [ROLE_STUDENT]: 'Siswa',
}

export const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }))

export const roleLabel = (role) => ROLE_LABELS[role] ?? role ?? '-'
