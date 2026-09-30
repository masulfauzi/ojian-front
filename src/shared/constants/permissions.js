// Aksi hak akses per menu, sama dengan kolom role_menus di backend (can_view, can_create, ...).
export const ACTION_VIEW = 'view'
export const ACTION_CREATE = 'create'
export const ACTION_UPDATE = 'update'
export const ACTION_DELETE = 'delete'

export const ACTIONS = [ACTION_VIEW, ACTION_CREATE, ACTION_UPDATE, ACTION_DELETE]

export const ACTION_LABELS = {
  [ACTION_VIEW]: 'Lihat',
  [ACTION_CREATE]: 'Tambah',
  [ACTION_UPDATE]: 'Ubah',
  [ACTION_DELETE]: 'Hapus',
}

/** Hak akses kosong: { view: false, create: false, update: false, delete: false } */
export const noPermission = () => Object.fromEntries(ACTIONS.map((action) => [action, false]))
