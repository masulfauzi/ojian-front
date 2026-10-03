/** ID elemen berikutnya dengan awalan tertentu: nextId('o', [{id:'o1'},{id:'o3'}]) → 'o4'. */
export function nextId(prefix, elements = []) {
  const used = elements
    .map((e) => (typeof e === 'string' ? e : e?.id))
    .filter((id) => typeof id === 'string' && id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter(Number.isFinite)
  return `${prefix}${used.length ? Math.max(...used) + 1 : 1}`
}

/** Daftar elemen awal: makeElements('o', 4) → [{id:'o1', text:''}, …]. */
export const makeElements = (prefix, count, extra = {}) =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i + 1}`, text: '', ...extra }))
