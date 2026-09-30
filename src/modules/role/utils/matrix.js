import { ACTIONS, ACTION_VIEW } from '@/shared/constants/permissions'

/**
 * Ubah satu hak pada baris matriks, menjaga aturan backend
 * (`role_menus_view_required`): hak tambah/ubah/hapus memerlukan hak lihat.
 * - mencentang tambah/ubah/hapus → lihat ikut tercentang;
 * - mencabut lihat → semua hak dicabut.
 */
export function setPermission(row, action, value) {
  if (action === ACTION_VIEW && !value) {
    return { ...row, ...Object.fromEntries(ACTIONS.map((a) => [a, false])) }
  }
  const next = { ...row, [action]: value }
  if (value && action !== ACTION_VIEW) next[ACTION_VIEW] = true
  return next
}

/** Centang/cabut semua hak yang diizinkan pada satu baris. */
export function setRow(row, value, isAllowed = () => true) {
  // Urutan penting: saat mencabut, lihat dicabut terakhir agar hak lain tetap konsisten.
  const actions = value ? ACTIONS : [...ACTIONS].reverse()
  return actions.reduce(
    (acc, action) => (isAllowed(row, action) ? setPermission(acc, action, value) : acc),
    row,
  )
}

/** Centang/cabut satu kolom aksi pada semua baris yang diizinkan. */
export function setColumn(rows, action, value, isAllowed = () => true) {
  return rows.map((row) => (isAllowed(row, action) ? setPermission(row, action, value) : row))
}

export const isRowFull = (row) => ACTIONS.every((action) => row[action])

export const isColumnFull = (rows, action) => rows.length > 0 && rows.every((row) => row[action])

/** Apakah matriks berbeda dari kondisi awal. */
export function isMatrixDirty(rows, original) {
  const byId = new Map(original.map((row) => [row.menuId, row]))
  return rows.some((row) =>
    ACTIONS.some((action) => row[action] !== byId.get(row.menuId)?.[action]),
  )
}

/**
 * Kelompokkan baris per induk menu. `groupName(parentId)` mengembalikan nama grup.
 * Grup mengikuti urutan kemunculan; baris di dalamnya diurutkan `sortOrder`.
 */
export function groupRows(rows, groupName) {
  const groups = new Map()
  for (const row of rows) {
    const key = row.parentId ?? ''
    if (!groups.has(key)) groups.set(key, { key, name: groupName(row.parentId), rows: [] })
    groups.get(key).rows.push(row)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    rows: group.rows.sort((a, b) => a.sortOrder - b.sortOrder),
  }))
}
