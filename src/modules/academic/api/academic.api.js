// Semua pemetaan kontrak endpoint /academic-years dan /semesters ada di file ini.
// Sumber: Swagger exam-api — tag "Akademik" (academic.YearResponse, SemesterResponse, …).
// `schoolId` hanya dikirim bila terisi: wajib untuk pengguna platform, diabaikan untuk user sekolah.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  start_date: 'startDate',
  end_date: 'endDate',
  school_id: 'schoolId',
  // Error per semester pada pembuatan tahun: semesters[0].start_date → ganjilStart, dst.
  'semesters[0].start_date': 'ganjilStart',
  'semesters[0].end_date': 'ganjilEnd',
  'semesters[1].start_date': 'genapStart',
  'semesters[1].end_date': 'genapEnd',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** Parameter query dengan `school_id` bila diperlukan. */
export const scoped = (schoolId, params = {}) =>
  schoolId ? { ...params, school_id: schoolId } : params

export const TERM_GANJIL = 1
export const TERM_GENAP = 2

export const toSemester = (data) => ({
  id: data.id,
  academicYearId: data.academic_year_id,
  term: data.term,
  termName: data.term_name ?? (data.term === TERM_GANJIL ? 'Ganjil' : 'Genap'),
  startDate: data.start_date,
  endDate: data.end_date,
  isActive: Boolean(data.is_active),
})

export const toYear = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  name: data.name,
  startDate: data.start_date,
  endDate: data.end_date,
  isActive: Boolean(data.is_active),
  semesters: (data.semesters ?? []).map(toSemester).sort((a, b) => a.term - b.term),
})

export const toActiveSemester = (data) => ({
  ...toSemester(data),
  academicYearName: data.academic_year_name,
})

export async function listAcademicYears({ schoolId, page = 1, limit = 10 } = {}) {
  const res = await http.get('/academic-years', { params: scoped(schoolId, { page, limit }) })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toYear), meta }
}

export async function getAcademicYear(id, { schoolId } = {}) {
  const res = await http.get(`/academic-years/${id}`, { params: scoped(schoolId) })
  return toYear(unwrap(res))
}

/** Membuat tahun pelajaran sekaligus semester Ganjil dan Genap (satu transaksi). */
export async function createAcademicYear(values, { schoolId } = {}) {
  const body = {
    name: values.name,
    start_date: values.startDate,
    end_date: values.endDate,
    semesters: [
      { term: TERM_GANJIL, start_date: values.ganjilStart, end_date: values.ganjilEnd },
      { term: TERM_GENAP, start_date: values.genapStart, end_date: values.genapEnd },
    ],
  }
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/academic-years', body).catch(rethrow)
  return toYear(unwrap(res))
}

export async function updateAcademicYear(id, values, { schoolId } = {}) {
  const body = { name: values.name, start_date: values.startDate, end_date: values.endDate }
  const res = await http
    .put(`/academic-years/${id}`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toYear(unwrap(res))
}

export async function deleteAcademicYear(id, { schoolId } = {}) {
  await http.delete(`/academic-years/${id}`, { params: scoped(schoolId) })
}

export async function listSemesters({ schoolId, academicYearId } = {}) {
  const params = scoped(schoolId, academicYearId ? { academic_year_id: academicYearId } : {})
  const res = await http.get('/semesters', { params })
  return (unwrap(res) ?? []).map(toSemester)
}

/** Semester aktif sekolah, atau null bila belum ada (backend membalas 404). */
export async function getActiveSemester({ schoolId } = {}) {
  try {
    const res = await http.get('/semesters/active', { params: scoped(schoolId) })
    return toActiveSemester(unwrap(res))
  } catch (error) {
    if (error?.status === 404) return null
    throw error
  }
}

export async function updateSemester(id, values, { schoolId } = {}) {
  const body = { start_date: values.startDate, end_date: values.endDate }
  const res = await http.put(`/semesters/${id}`, body, { params: scoped(schoolId) }).catch(rethrow)
  return toSemester(unwrap(res))
}

/** Aktifkan semester; semester aktif sebelumnya dinonaktifkan backend. */
export async function activateSemester(id, { schoolId } = {}) {
  const res = await http.post(`/semesters/${id}/activate`, null, { params: scoped(schoolId) })
  return toSemester(unwrap(res))
}

/** Salin anggota kelas dari semester asal (Ganjil) ke semester `toSemesterId` (Genap). */
export async function copyMemberships(toSemesterId, fromSemesterId, { schoolId } = {}) {
  const res = await http.post(
    `/semesters/${toSemesterId}/copy-memberships`,
    { from_semester_id: fromSemesterId },
    { params: scoped(schoolId) },
  )
  return { copied: unwrap(res)?.copied ?? 0 }
}
