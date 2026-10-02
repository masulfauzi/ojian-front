// Public API modul auth. Modul lain hanya boleh mengimpor dari sini: `@/modules/auth`.
export { useAuthStore } from './stores/auth.store'
export { useCan } from './composables/useCan'
// Pemetaan AuthResponse (token + user + role) untuk endpoint lain yang juga memulai sesi.
export { toSession } from './api/auth.api'
export {
  ROLE_SUPER_ADMIN,
  ROLE_SCHOOL_ADMIN,
  ROLE_TEACHER,
  ROLE_STUDENT,
  SYSTEM_ROLE_CODES,
} from '@/shared/constants/roles'
