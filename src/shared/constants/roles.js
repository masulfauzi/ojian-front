// Kode role sistem (seed backend). Role kustom sekolah dibuat lewat modul role, jadi daftar
// role lengkap selalu diambil dari API; konstanta ini hanya untuk aturan khusus role sistem.
export const ROLE_SUPER_ADMIN = 'super_admin'
export const ROLE_SCHOOL_ADMIN = 'school_admin'
export const ROLE_TEACHER = 'teacher'
export const ROLE_STUDENT = 'student'

export const SYSTEM_ROLE_CODES = [ROLE_SUPER_ADMIN, ROLE_SCHOOL_ADMIN, ROLE_TEACHER, ROLE_STUDENT]
