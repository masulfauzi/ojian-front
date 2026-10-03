// Semua pemetaan kontrak endpoint /classes dan /promotions ada di file ini.
// Sumber: Swagger exam-api — tag "Kelas" (classroom.ClassResponse, MemberResponse, PromotionRequest).
// `schoolId` hanya dikirim bila terisi: wajib untuk pengguna platform, diabaikan untuk user sekolah.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  academic_year_id: 'academicYearId',
  grade_level: 'gradeLevel',
  homeroom_user_id: 'homeroomUserId',
  from_academic_year_id: 'fromYearId',
  to_academic_year_id: 'toYearId',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toClass = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  academicYearId: data.academic_year_id,
  name: data.name,
  gradeLevel: data.grade_level,
  homeroomUserId: data.homeroom_user_id ?? null,
  homeroomName: data.homeroom_name ?? null,
  studentCount: data.student_count ?? 0,
})

export const toMember = (data) => ({
  studentId: data.student_id,
  name: data.name,
  nis: data.nis,
  nisn: data.nisn ?? null,
  gender: data.gender ?? null,
  status: data.status,
})

function toClassBody(values) {
  const body = { name: values.name, grade_level: values.gradeLevel }
  // Kosong = tanpa wali kelas.
  if (values.homeroomUserId) body.homeroom_user_id = values.homeroomUserId
  return body
}

export async function listClasses({
  schoolId,
  academicYearId,
  semesterId,
  gradeLevel,
  search,
  page = 1,
  limit = 10,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (academicYearId) params.academic_year_id = academicYearId
  if (semesterId) params.semester_id = semesterId
  if (gradeLevel) params.grade_level = gradeLevel
  if (search) params.search = search
  const res = await http.get('/classes', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toClass), meta }
}

/** Semua kelas pada satu tahun pelajaran (untuk pilihan; maks 100). */
export async function listClassOptions({ schoolId, academicYearId, semesterId } = {}) {
  if (!academicYearId) return []
  const { items } = await listClasses({ schoolId, academicYearId, semesterId, limit: 100 })
  return items
}

export async function getClass(id, { schoolId } = {}) {
  const res = await http.get(`/classes/${id}`, { params: scoped(schoolId) })
  return toClass(unwrap(res))
}

export async function createClass(values, { schoolId } = {}) {
  const body = { ...toClassBody(values), academic_year_id: values.academicYearId }
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/classes', body).catch(rethrow)
  return toClass(unwrap(res))
}

export async function updateClass(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/classes/${id}`, toClassBody(values), { params: scoped(schoolId) })
    .catch(rethrow)
  return toClass(unwrap(res))
}

export async function deleteClass(id, { schoolId } = {}) {
  await http.delete(`/classes/${id}`, { params: scoped(schoolId) })
}

/** Salin nama dan tingkat kelas (tanpa wali kelas); kelas dengan nama sama dilewati. */
export async function copyClasses({ fromYearId, toYearId }, { schoolId } = {}) {
  const body = { from_academic_year_id: fromYearId, to_academic_year_id: toYearId }
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/classes/copy', body).catch(rethrow)
  return { copied: unwrap(res)?.copied ?? 0 }
}

export async function listMembers(classId, { semesterId, schoolId } = {}) {
  const params = scoped(schoolId, semesterId ? { semester_id: semesterId } : {})
  const res = await http.get(`/classes/${classId}/students`, { params })
  return (unwrap(res) ?? []).map(toMember)
}

/** Tempatkan siswa ke kelas pada semester; siswa yang sudah punya kelas di semester itu dipindah. */
export async function setMembers(classId, { semesterId, studentIds }, { schoolId } = {}) {
  const res = await http.put(
    `/classes/${classId}/students`,
    { semester_id: semesterId, student_ids: studentIds },
    { params: scoped(schoolId) },
  )
  return (unwrap(res) ?? []).map(toMember)
}

export async function removeMember(classId, studentId, { semesterId, schoolId } = {}) {
  const params = scoped(schoolId, semesterId ? { semester_id: semesterId } : {})
  await http.delete(`/classes/${classId}/students/${studentId}`, { params })
}

/**
 * Siswa aktif yang belum punya kelas pada semester (calon anggota kelas).
 * Memanggil endpoint /students langsung (bukan lewat modul student) agar modul classroom
 * tidak bergantung pada modul student, yang sendiri bergantung pada classroom.
 */
export async function listAssignableStudents({ schoolId, semesterId, search } = {}) {
  const params = scoped(schoolId, { unassigned: true, status: 'active', limit: 100 })
  if (semesterId) params.semester_id = semesterId
  if (search) params.search = search
  const res = await http.get('/students', { params })
  const { items, meta } = unwrapList(res)
  return {
    items: items.map((s) => ({
      id: s.id,
      name: s.name,
      nis: s.nis,
      nisn: s.nisn ?? null,
      gender: s.gender ?? null,
    })),
    total: meta.total,
  }
}

/**
 * Naik kelas dan kelulusan dalam satu transaksi.
 * `payload` dari `buildPromotionPayload` (utils/promotion.js).
 */
export async function promote(payload, { schoolId } = {}) {
  const body = {
    from_semester_id: payload.fromSemesterId,
    to_semester_id: payload.toSemesterId,
    mappings: payload.mappings.map((m) =>
      m.toClassId
        ? { from_class_id: m.fromClassId, to_class_id: m.toClassId }
        : { from_class_id: m.fromClassId },
    ),
    activate: Boolean(payload.activate),
  }
  if (payload.studentIds) body.student_ids = payload.studentIds
  if (payload.overrides?.length) {
    body.overrides = payload.overrides.map((o) => ({
      student_id: o.studentId,
      to_class_id: o.toClassId,
    }))
  }
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/promotions', body).catch(rethrow)
  const data = unwrap(res) ?? {}
  return {
    promoted: data.promoted ?? 0,
    graduated: data.graduated ?? 0,
    skipped: data.skipped ?? 0,
  }
}
