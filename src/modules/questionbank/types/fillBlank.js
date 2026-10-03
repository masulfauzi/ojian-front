// Sama dengan pola backend: {{ id }} dengan id huruf, angka, titik, garis bawah, tanda hubung.
const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g

/** ID rumpang sesuai urutan kemunculan di template (unik). */
export function blankIdsIn(template) {
  return [...new Set([...(template ?? '').matchAll(PLACEHOLDER)].map((m) => m[1]))]
}

export const emptyBlank = (id) => ({ id, kind: 'text', max_length: 50 })

export const emptyBlankKey = (kind) =>
  kind === 'select'
    ? { correct: null }
    : { accepted: [], match: { case_sensitive: false, trim: true, collapse_spaces: true } }

/**
 * Sesuaikan daftar rumpang dan kuncinya dengan template: rumpang baru ditambahkan (jenis
 * ketik), rumpang yang tidak lagi ada di template dibuang, urutan mengikuti template.
 */
export function syncBlanks(template, blanks = [], keyBlanks = {}) {
  const ids = blankIdsIn(template)
  const byId = new Map(blanks.map((b) => [b.id, b]))
  const nextBlanks = ids.map((id) => byId.get(id) ?? emptyBlank(id))
  const nextKeys = Object.fromEntries(
    nextBlanks.map((b) => [b.id, keyBlanks[b.id] ?? emptyBlankKey(b.kind)]),
  )
  return { blanks: nextBlanks, keyBlanks: nextKeys }
}

/** Potong template menjadi bagian teks dan rumpang untuk dirender: [{html}|{blankId}]. */
export function splitTemplate(template) {
  const parts = []
  let last = 0
  for (const match of (template ?? '').matchAll(PLACEHOLDER)) {
    if (match.index > last) parts.push({ html: template.slice(last, match.index) })
    parts.push({ blankId: match[1] })
    last = match.index + match[0].length
  }
  if (last < (template ?? '').length) parts.push({ html: template.slice(last) })
  return parts
}
