// Pemetaan kontrak endpoint /stimuli (teks bacaan). Body HTML disanitasi backend.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { stripMediaSrc } from '@/shared/utils/mediaHtml'

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toStimulus = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  title: data.title,
  body: data.body ?? '',
  createdBy: data.created_by,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

const toBody = (values) => ({ title: values.title, body: stripMediaSrc(values.body) })

export async function listStimuli({ schoolId, page = 1, limit = 10, search } = {}) {
  const params = scoped(schoolId, { page, limit })
  if (search) params.search = search
  const res = await http.get('/stimuli', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toStimulus), meta }
}

export async function getStimulus(id, { schoolId } = {}) {
  const res = await http.get(`/stimuli/${id}`, { params: scoped(schoolId) })
  return toStimulus(unwrap(res))
}

export async function createStimulus(values) {
  const res = await http.post('/stimuli', toBody(values))
  return toStimulus(unwrap(res))
}

/** Ditolak 409 bila dipakai versi soal yang sudah terkunci ujian. */
export async function updateStimulus(id, values, { schoolId } = {}) {
  const res = await http.put(`/stimuli/${id}`, toBody(values), { params: scoped(schoolId) })
  return toStimulus(unwrap(res))
}

export async function deleteStimulus(id, { schoolId } = {}) {
  await http.delete(`/stimuli/${id}`, { params: scoped(schoolId) })
}
