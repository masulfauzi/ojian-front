// Semua pemetaan kontrak endpoint /menus ada di file ini.
// Sumber: Swagger exam-api — menu.MenuRequest, menu.MenuResponse, menu.ReorderRequest.
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { parent_id: 'parentId', sort_order: 'sortOrder', is_active: 'isActive' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

export const toMenu = (data) => ({
  id: data.id,
  parentId: data.parent_id ?? null,
  code: data.code,
  name: data.name,
  type: data.type,
  path: data.path ?? null,
  icon: data.icon ?? null,
  sortOrder: data.sort_order ?? 0,
  isActive: Boolean(data.is_active),
  isSystem: Boolean(data.is_system),
  children: (data.children ?? []).map(toMenu),
})

function toPayload(values) {
  const isPage = values.type === 'page'
  const payload = {
    code: values.code,
    name: values.name,
    type: values.type,
    // Grup tidak punya path dan selalu di tingkat akar (kedalaman maksimal 2).
    path: isPage ? values.path : null,
    parent_id: isPage ? (values.parentId ?? null) : null,
    icon: values.icon ?? null,
    sort_order: values.sortOrder ?? 0,
  }
  // is_active hanya dipakai saat update; saat create menu selalu aktif.
  if (typeof values.isActive === 'boolean') payload.is_active = values.isActive
  return payload
}

/** Seluruh menu (termasuk nonaktif) dalam bentuk pohon. */
export async function getMenuTree() {
  const res = await http.get('/menus')
  return (unwrap(res) ?? []).map(toMenu)
}

export async function createMenu(values) {
  const res = await http.post('/menus', toPayload(values)).catch(rethrow)
  return toMenu(unwrap(res))
}

export async function updateMenu(id, values) {
  const res = await http.put(`/menus/${id}`, toPayload(values)).catch(rethrow)
  return toMenu(unwrap(res))
}

export async function deleteMenu(id) {
  await http.delete(`/menus/${id}`)
}

/** items: [{ id, parentId, sortOrder }] — diubah dalam satu transaksi. */
export async function reorderMenus(items) {
  await http.patch('/menus/reorder', {
    items: items.map(({ id, parentId, sortOrder }) => ({
      id,
      parent_id: parentId,
      sort_order: sortOrder,
    })),
  })
}
