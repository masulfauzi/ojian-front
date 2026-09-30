// Semua pemetaan kontrak endpoint /schools ada di file ini.
// Sumber: Swagger exam-api — school.SchoolRequest dan school.SchoolResponse.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  education_level: 'educationLevel',
  postal_code: 'postalCode',
  logo_url: 'logoUrl',
  is_active: 'isActive',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

export const toSchool = (data) => ({
  id: data.id,
  code: data.code,
  name: data.name,
  npsn: data.npsn ?? null,
  educationLevel: data.education_level,
  ownership: data.ownership ?? null,
  address: data.address ?? null,
  city: data.city ?? null,
  province: data.province ?? null,
  postalCode: data.postal_code ?? null,
  phone: data.phone ?? null,
  email: data.email ?? null,
  logoUrl: data.logo_url ?? null,
  isActive: Boolean(data.is_active),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

function toPayload(values) {
  const payload = {
    code: values.code,
    name: values.name,
    npsn: values.npsn ?? null,
    education_level: values.educationLevel,
    ownership: values.ownership ?? null,
    address: values.address ?? null,
    city: values.city ?? null,
    province: values.province ?? null,
    postal_code: values.postalCode ?? null,
    phone: values.phone ?? null,
    email: values.email ?? null,
    logo_url: values.logoUrl ?? null,
  }
  // is_active hanya dipakai saat update; saat create sekolah selalu aktif.
  if (typeof values.isActive === 'boolean') payload.is_active = values.isActive
  return payload
}

export async function listSchools({ page = 1, limit = 10, search, educationLevel, isActive } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (educationLevel) params.education_level = educationLevel
  if (typeof isActive === 'boolean') params.is_active = isActive
  const res = await http.get('/schools', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toSchool), meta }
}

export async function getSchool(id) {
  const res = await http.get(`/schools/${id}`)
  return toSchool(unwrap(res))
}

export async function createSchool(values) {
  const res = await http.post('/schools', toPayload(values)).catch(rethrow)
  return toSchool(unwrap(res))
}

export async function updateSchool(id, values) {
  const res = await http.put(`/schools/${id}`, toPayload(values)).catch(rethrow)
  return toSchool(unwrap(res))
}

export async function deleteSchool(id) {
  await http.delete(`/schools/${id}`)
}
