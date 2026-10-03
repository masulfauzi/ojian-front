/**
 * Urutan item untuk disimpan di `content` soal mengurutkan. Backend menolak item yang
 * tersimpan dalam urutan benar, jadi urutan benar diputar satu langkah (deterministik dan
 * dijamin berbeda untuk ≥ 2 item).
 */
export function scramble(order) {
  if (order.length < 2) return [...order]
  return [...order.slice(1), order[0]]
}

/** Urutan benar (dari kunci) → elemen dalam urutan itu, untuk ditampilkan di editor. */
export function itemsInOrder(items, order) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = (order ?? []).map((id) => byId.get(id)).filter(Boolean)
  return [...ordered, ...items.filter((item) => !(order ?? []).includes(item.id))]
}
