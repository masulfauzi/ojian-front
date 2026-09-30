export const SORT_STEP = 10

/** Salin pohon menu (dua tingkat) agar bisa diubah tanpa menyentuh data asli. */
export const cloneTree = (tree) =>
  tree.map((node) => ({ ...node, children: (node.children ?? []).map((c) => ({ ...c })) }))

/**
 * Posisi tiap menu menurut urutan tampilan saat ini:
 * [{ id, parentId, sortOrder }] dengan sortOrder kelipatan SORT_STEP per induk.
 */
export function flattenTree(tree) {
  const result = []
  tree.forEach((node, index) => {
    result.push({ id: node.id, parentId: null, sortOrder: (index + 1) * SORT_STEP })
    ;(node.children ?? []).forEach((child, childIndex) => {
      result.push({ id: child.id, parentId: node.id, sortOrder: (childIndex + 1) * SORT_STEP })
    })
  })
  return result
}

/** Posisi asli dari data server: id → { parentId, sortOrder }. */
export function positionsOf(tree) {
  const map = new Map()
  for (const node of tree) {
    map.set(node.id, { parentId: node.parentId ?? null, sortOrder: node.sortOrder })
    for (const child of node.children ?? []) {
      map.set(child.id, { parentId: child.parentId ?? node.id, sortOrder: child.sortOrder })
    }
  }
  return map
}

/**
 * Isi body PATCH /menus/reorder: hanya menu yang induk atau urutannya berubah
 * dibanding posisi asli.
 */
export function buildReorderItems(tree, original) {
  return flattenTree(tree).filter((item) => {
    const before = original.get(item.id)
    return !before || before.parentId !== item.parentId || before.sortOrder !== item.sortOrder
  })
}

/** Semua grup di akar (calon induk sebuah halaman). */
export const groupsOf = (tree) => tree.filter((node) => node.type === 'group')

/** Urutan berikutnya untuk menu baru di bawah `parentId` (null = akar). */
export function nextSortOrder(tree, parentId = null) {
  const siblings = parentId ? (tree.find((n) => n.id === parentId)?.children ?? []) : tree
  return siblings.reduce((max, node) => Math.max(max, node.sortOrder ?? 0), 0) + SORT_STEP
}

/** Posisi relatif: id → { parentId, index } (urutan di antara saudara, bukan nomor sort_order). */
export function slotsOf(tree) {
  const map = new Map()
  tree.forEach((node, index) => {
    map.set(node.id, { parentId: null, index })
    ;(node.children ?? []).forEach((child, childIndex) => {
      map.set(child.id, { parentId: node.id, index: childIndex })
    })
  })
  return map
}

/**
 * Jumlah menu yang benar-benar dipindah pengguna (induk atau urutan relatifnya berubah).
 * Nomor sort_order yang tidak rapi (mis. 90) tidak dianggap perubahan.
 */
export function countMoved(tree, originalSlots) {
  let moved = 0
  for (const [id, slot] of slotsOf(tree)) {
    const before = originalSlots.get(id)
    if (!before || before.parentId !== slot.parentId || before.index !== slot.index) moved++
  }
  return moved
}
