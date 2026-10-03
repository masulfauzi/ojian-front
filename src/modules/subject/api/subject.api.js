// Semua pemetaan kontrak endpoint /subjects ada di file ini.
// Sumber: Swagger exam-api — tag "Mata Pelajaran" (subject.SubjectResponse, Create/UpdateSubjectRequest).
// `schoolId` hanya dikirim bila terisi: wajib untuk pengguna platform, diabaikan untuk user sekolah.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { is_active: 'isActive', school_id: 'schoolId' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

/** Field form untuk 409 (kode atau nama sudah dipakai di sekolah ini). */
export const conflictField = (error) => (/nama/i.test(error?.message ?? '') ? 'name' : 'code')

export const toSubject = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  code: data.code,
  name: data.name,
  isActive: Boolean(data.is_active),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

export async function listSubjects({ schoolId, page = 1, limit = 10, search, isActive } = {}) {
  const params = scoped(schoolId, { page, limit })
  if (search) params.search = search
  if (typeof isActive === 'boolean') params.is_active = isActive
  const res = await http.get('/subjects', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toSubject), meta }
}

/** Mata pelajaran untuk pilihan (maks 100). `activeOnly` untuk form soal baru. */
export async function listSubjectOptions({ schoolId, activeOnly = false } = {}) {
  const { items } = await listSubjects({
    schoolId,
    limit: 100,
    isActive: activeOnly ? true : undefined,
  })
  return items
}

export async function createSubject(values, { schoolId } = {}) {
  const body = { code: values.code, name: values.name }
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/subjects', body).catch(rethrow)
  return toSubject(unwrap(res))
}

export async function updateSubject(id, values, { schoolId } = {}) {
  const body = { code: values.code, name: values.name, is_active: values.isActive }
  const res = await http.put(`/subjects/${id}`, body, { params: scoped(schoolId) }).catch(rethrow)
  return toSubject(unwrap(res))
}

export async function deleteSubject(id, { schoolId } = {}) {
  await http.delete(`/subjects/${id}`, { params: scoped(schoolId) })
}
