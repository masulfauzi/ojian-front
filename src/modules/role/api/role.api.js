// Semua pemetaan kontrak endpoint /roles ada di file ini.
// Sumber: Swagger exam-api — role.RoleRequest, role.RoleResponse, role.MatrixItem.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { school_id: 'schoolId', is_active: 'isActive' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

export const toRole = (data) => ({
  id: data.id,
  code: data.code,
  name: data.name,
  description: data.description ?? null,
  schoolId: data.school_id ?? null,
  isSystem: Boolean(data.is_system),
  isActive: Boolean(data.is_active),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

/** MatrixItem → baris matriks: { menuId, code, name, parentId, sortOrder, view, create, update, delete } */
export const toMatrixRow = (data) => ({
  menuId: data.menu_id,
  code: data.code,
  name: data.name,
  parentId: data.parent_id ?? null,
  sortOrder: data.sort_order ?? 0,
  view: Boolean(data.can_view),
  create: Boolean(data.can_create),
  update: Boolean(data.can_update),
  delete: Boolean(data.can_delete),
})

function toPayload(values) {
  const payload = {
    code: values.code,
    name: values.name,
    description: values.description ?? null,
  }
  // school_id hanya dipakai saat create oleh pengguna platform; diabaikan saat update.
  if (values.schoolId) payload.school_id = values.schoolId
  if (typeof values.isActive === 'boolean') payload.is_active = values.isActive
  return payload
}

export async function listRoles({ page = 1, limit = 10, search, schoolId } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (schoolId) params.school_id = schoolId
  const res = await http.get('/roles', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toRole), meta }
}

/**
 * Role aktif yang bisa diberikan ke user: role sistem + role kustom sekolah `schoolId`.
 * (Pengguna sekolah otomatis hanya melihat role sekolahnya; `schoolId` diabaikan backend.)
 */
export async function listRoleOptions(schoolId = null) {
  const { items } = await listRoles({ page: 1, limit: 100, schoolId })
  return items.filter(
    (role) => role.isActive && (!schoolId || !role.schoolId || role.schoolId === schoolId),
  )
}

export async function getRole(id) {
  const res = await http.get(`/roles/${id}`)
  return toRole(unwrap(res))
}

export async function createRole(values) {
  const res = await http.post('/roles', toPayload(values)).catch(rethrow)
  return toRole(unwrap(res))
}

export async function updateRole(id, values) {
  const res = await http.put(`/roles/${id}`, toPayload(values)).catch(rethrow)
  return toRole(unwrap(res))
}

export async function deleteRole(id) {
  await http.delete(`/roles/${id}`)
}

export async function getRoleMatrix(id) {
  const res = await http.get(`/roles/${id}/menus`)
  return (unwrap(res) ?? []).map(toMatrixRow)
}

/** Replace all: baris tanpa hak lihat tidak dikirim (berarti tidak punya akses). */
export async function saveRoleMatrix(id, rows) {
  const items = rows
    .filter((row) => row.view)
    .map((row) => ({
      menu_id: row.menuId,
      can_view: row.view,
      can_create: row.create,
      can_update: row.update,
      can_delete: row.delete,
    }))
  const res = await http.put(`/roles/${id}/menus`, { items })
  return (unwrap(res) ?? []).map(toMatrixRow)
}
