// Semua pemetaan kontrak endpoint /students ada di file ini.
// Sumber: Swagger exam-api — tag "Siswa" (student.StudentResponse, CreateStudentRequest, ImportReport).
// `schoolId` hanya dikirim bila terisi: wajib untuk pengguna platform, diabaikan untuk user sekolah.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  birth_place: 'birthPlace',
  birth_date: 'birthDate',
  admission_date: 'admissionDate',
  class_id: 'classId',
  school_id: 'schoolId',
  // Akun siswa memakai NISN sebagai username; error modul pengguna merujuk ke `username`.
  username: 'nisn',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

/** Field form untuk error 409 berdasarkan pesan backend (NIS/NISN/email sudah dipakai). */
export function conflictField(error) {
  const message = error?.message ?? ''
  if (/nisn|username/i.test(message)) return 'nisn'
  if (/\bnis\b/i.test(message)) return 'nis'
  if (/email/i.test(message)) return 'email'
  return null
}

export const toStudent = (data) => ({
  id: data.id,
  userId: data.user_id,
  schoolId: data.school_id,
  name: data.name,
  username: data.username,
  email: data.email ?? null,
  nis: data.nis,
  nisn: data.nisn ?? null,
  gender: data.gender ?? null,
  birthPlace: data.birth_place ?? null,
  birthDate: data.birth_date ?? null,
  admissionDate: data.admission_date ?? null,
  status: data.status,
  statusChangedAt: data.status_changed_at ?? null,
  accountActive: Boolean(data.account_active),
  class: data.class
    ? { id: data.class.id, name: data.class.name, gradeLevel: data.class.grade_level }
    : null,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

export const toHistoryItem = (data) => ({
  semesterId: data.semester_id,
  academicYear: data.academic_year,
  term: data.term,
  termName: data.term_name,
  classId: data.class_id,
  className: data.class_name,
  gradeLevel: data.grade_level,
})

/** Field opsional hanya dikirim bila terisi. */
const OPTIONAL = {
  gender: 'gender',
  birthPlace: 'birth_place',
  birthDate: 'birth_date',
  admissionDate: 'admission_date',
  email: 'email',
}

function toBody(values) {
  const body = { name: values.name, nis: values.nis, nisn: values.nisn }
  for (const [key, apiKey] of Object.entries(OPTIONAL)) {
    if (values[key]) body[apiKey] = values[key]
  }
  return body
}

export async function listStudents({
  schoolId,
  page = 1,
  limit = 10,
  search,
  status,
  semesterId,
  classId,
  unassigned,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (search) params.search = search
  if (status) params.status = status
  if (semesterId) params.semester_id = semesterId
  if (classId) params.class_id = classId
  if (unassigned) params.unassigned = true
  const res = await http.get('/students', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toStudent), meta }
}

export async function getStudent(id, { schoolId } = {}) {
  const res = await http.get(`/students/${id}`, { params: scoped(schoolId) })
  return toStudent(unwrap(res))
}

/**
 * Tambah siswa beserta akunnya (username = NISN, wajib ganti password).
 * @returns {{ student, initialPassword: string|null }} password awal hanya ada bila dibuat otomatis.
 */
export async function createStudent(values, { schoolId } = {}) {
  const body = toBody(values)
  if (values.password) body.password = values.password
  if (values.classId) body.class_id = values.classId
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/students', body).catch(rethrow)
  const data = unwrap(res)
  return { student: toStudent(data), initialPassword: data.initial_password || null }
}

/** Status selain `active` menonaktifkan akun siswa; kembali `active` mengaktifkannya. */
export async function updateStudent(id, values, { schoolId } = {}) {
  const body = { ...toBody(values), status: values.status }
  const res = await http.put(`/students/${id}`, body, { params: scoped(schoolId) }).catch(rethrow)
  return toStudent(unwrap(res))
}

export async function deleteStudent(id, { schoolId } = {}) {
  await http.delete(`/students/${id}`, { params: scoped(schoolId) })
}

export async function getClassHistory(id, { schoolId } = {}) {
  const res = await http.get(`/students/${id}/class-history`, { params: scoped(schoolId) })
  return (unwrap(res) ?? []).map(toHistoryItem)
}

/** File template impor (.xlsx) sebagai Blob. */
export async function downloadImportTemplate() {
  const res = await http.get('/students/import/template', { responseType: 'blob' })
  return res.data
}

export const toImportRow = (data) => ({
  row: data.row,
  nisn: data.nisn ?? null,
  name: data.name ?? null,
  status: data.status,
  message: data.message ?? null,
  initialPassword: data.initial_password || null,
})

/**
 * Impor siswa dari Excel. Setiap baris diproses terpisah; laporan memuat baris berhasil
 * (dengan password awal bila dibuat otomatis) dan baris gagal beserta alasannya.
 */
export async function importStudents(file, { schoolId } = {}) {
  const form = new FormData()
  form.append('file', file)
  const res = await http.post('/students/import', form, {
    params: scoped(schoolId),
    // Hingga 2000 baris diproses satu per satu di server.
    timeout: 180_000,
  })
  const data = unwrap(res) ?? {}
  return {
    total: data.total ?? 0,
    created: data.created ?? 0,
    failed: data.failed ?? 0,
    rows: (data.rows ?? []).map(toImportRow),
  }
}
