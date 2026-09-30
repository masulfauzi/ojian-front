// Semua pemetaan kontrak endpoint /users ada di file ini.
// Sumber: Swagger exam-api — user.CreateUserRequest, user.UpdateUserRequest, user.UserResponse.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  school_id: 'schoolId',
  role_ids: 'roleIds',
  default_role_id: 'defaultRoleId',
  avatar_url: 'avatarUrl',
  is_active: 'isActive',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** UserRoleResponse: { id, code, name, is_default } */
const toUserRole = (data) => ({
  id: data.id,
  code: data.code,
  name: data.name,
  isDefault: Boolean(data.is_default),
})

export const toUser = (data) => ({
  id: data.id,
  schoolId: data.school_id ?? null,
  name: data.name,
  username: data.username,
  email: data.email ?? null,
  phone: data.phone ?? null,
  avatarUrl: data.avatar_url ?? null,
  isActive: Boolean(data.is_active),
  mustChangePassword: Boolean(data.must_change_password),
  lastLoginAt: data.last_login_at ?? null,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  roles: (data.roles ?? []).map(toUserRole),
})

function toPayload(values) {
  const payload = {
    name: values.name,
    username: values.username,
    email: values.email ?? null,
    phone: values.phone ?? null,
    // null = pengguna platform (hanya untuk super_admin).
    school_id: values.schoolId ?? null,
    role_ids: values.roleIds,
  }
  // Kosong: role pertama menjadi default.
  if (values.defaultRoleId) payload.default_role_id = values.defaultRoleId
  if (values.password) payload.password = values.password
  if (typeof values.isActive === 'boolean') payload.is_active = values.isActive
  return payload
}

export async function listUsers({ page = 1, limit = 10, search, schoolId, roleId, isActive } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (schoolId) params.school_id = schoolId
  if (roleId) params.role_id = roleId
  if (typeof isActive === 'boolean') params.is_active = isActive
  const res = await http.get('/users', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toUser), meta }
}

export async function getUser(id) {
  const res = await http.get(`/users/${id}`)
  return toUser(unwrap(res))
}

export async function createUser(values) {
  const res = await http.post('/users', toPayload(values)).catch(rethrow)
  return toUser(unwrap(res))
}

/** PUT mengganti data dan seluruh role user (tanpa password). */
export async function updateUser(id, values) {
  const { password: _password, ...rest } = values
  const res = await http.put(`/users/${id}`, toPayload(rest)).catch(rethrow)
  return toUser(unwrap(res))
}

export async function deleteUser(id) {
  await http.delete(`/users/${id}`)
}
