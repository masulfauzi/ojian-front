// Semua pemetaan kontrak endpoint registrasi mandiri sekolah ada di file ini.
// Sumber: Swagger exam-api — tag "Registrasi Sekolah" (RegisterSchoolRequest, NPSNCheckResponse).
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'
import { toSession } from '@/modules/auth'

// Endpoint publik: tanpa header Authorization dan tidak memicu siklus refresh saat 401.
const PUBLIC = { skipAuth: true, skipAuthRefresh: true }

const FIELD_MAP = {
  school_name: 'schoolName',
  education_level: 'educationLevel',
  postal_code: 'postalCode',
  school_phone: 'schoolPhone',
  school_email: 'schoolEmail',
  admin_name: 'adminName',
  admin_username: 'adminUsername',
  admin_email: 'adminEmail',
  admin_phone: 'adminPhone',
  // Error dari modul sekolah/pengguna di dalam proses registrasi memakai nama field mereka.
  code: 'npsn', // kode sekolah otomatis = NPSN
  username: 'adminUsername',
  email: 'adminEmail',
  phone: 'adminPhone',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** Field opsional: kirim hanya bila terisi (backend memakai `omitempty`). */
const OPTIONAL_FIELDS = {
  ownership: 'ownership',
  address: 'address',
  city: 'city',
  province: 'province',
  postalCode: 'postal_code',
  schoolPhone: 'school_phone',
  schoolEmail: 'school_email',
  adminPhone: 'admin_phone',
}

export function toRegisterPayload(values) {
  const payload = {
    npsn: values.npsn,
    school_name: values.schoolName,
    education_level: values.educationLevel,
    admin_name: values.adminName,
    admin_username: values.adminUsername,
    admin_email: values.adminEmail,
    password: values.password,
  }
  for (const [key, apiKey] of Object.entries(OPTIONAL_FIELDS)) {
    if (values[key]) payload[apiKey] = values[key]
  }
  return payload
}

/**
 * Field form untuk error 409 (tanpa detail field), berdasarkan pesan backend:
 * NPSN/kode sekolah sudah dipakai, username sudah dipakai, atau email sudah dipakai.
 */
export function conflictField(error) {
  const message = error?.message ?? ''
  if (/npsn|kode sekolah/i.test(message)) return 'npsn'
  if (/username/i.test(message)) return 'adminUsername'
  if (/email/i.test(message)) return 'adminEmail'
  return null
}

/** Periksa apakah NPSN sudah didaftarkan: `{ npsn, registered }`. */
export async function checkNpsn(npsn) {
  const res = await http
    .get(`/auth/register-school/npsn/${encodeURIComponent(npsn)}`, PUBLIC)
    .catch(rethrow)
  const data = unwrap(res)
  return { npsn: data.npsn, registered: Boolean(data.registered) }
}

/** Daftarkan sekolah + admin sekolah. Mengembalikan sesi login admin sekolah (lihat `toSession`). */
export async function registerSchool(values) {
  const res = await http
    .post('/auth/register-school', toRegisterPayload(values), PUBLIC)
    .catch(rethrow)
  return toSession(unwrap(res))
}
