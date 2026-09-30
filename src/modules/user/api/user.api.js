// Semua pemetaan kontrak endpoint /users ada di file ini.
// Sumber: Swagger exam-api (docs/swagger.yaml) — UserResponse, CreateUserRequest, UpdateUserRequest.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { is_active: 'isActive' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** data: { id, name, email, role, is_active, created_at, updated_at } */
export const toUser = (data) => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  isActive: data.is_active,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

const toCreatePayload = ({ name, email, password, role }) => ({ name, email, password, role })

// PUT: semua field wajib dikirim.
const toUpdatePayload = ({ name, email, role, isActive }) => ({
  name,
  email,
  role,
  is_active: isActive,
})

/** @returns {Promise<{ items: object[], meta: { page, limit, total, totalPages } }>} */
export async function listUsers({ page = 1, limit = 10, search = '', role = '' } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (role) params.role = role
  const res = await http.get('/users', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toUser), meta }
}

export async function getUser(id) {
  const res = await http.get(`/users/${id}`)
  return toUser(unwrap(res))
}

export async function createUser(values) {
  const res = await http.post('/users', toCreatePayload(values)).catch(rethrow)
  return toUser(unwrap(res))
}

export async function updateUser(id, values) {
  const res = await http.put(`/users/${id}`, toUpdatePayload(values)).catch(rethrow)
  return toUser(unwrap(res))
}

export async function deleteUser(id) {
  await http.delete(`/users/${id}`)
}
