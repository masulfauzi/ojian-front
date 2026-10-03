// Gambar unggahan di HTML disimpan sebagai <img data-media-id="…"> tanpa src, karena URL
// bertanda tangan dari server berumur pendek. Saat ditampilkan/diedit, src diisi dari peta
// mediaId → URL; sebelum disimpan, src dibuang lagi.

const MEDIA_ID_ATTR = /data-media-id="([0-9a-fA-F-]{36})"/g

/** ID media unik yang direferensikan di HTML. */
export function mediaIdsIn(html) {
  if (!html) return []
  return [...new Set([...html.matchAll(MEDIA_ID_ATTR)].map((m) => m[1]))]
}

function transformImages(html, fn) {
  if (!html || !html.includes('data-media-id')) return html ?? ''
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll('img[data-media-id]').forEach(fn)
  return template.innerHTML
}

/** Isi src gambar ber-data-media-id dari peta { mediaId: url }. */
export function withMediaUrls(html, urls) {
  return transformImages(html, (img) => {
    const url = urls[img.getAttribute('data-media-id')]
    if (url) img.setAttribute('src', url)
  })
}

/** Buang src gambar ber-data-media-id (URL bertanda tangan tidak boleh tersimpan). */
export function stripMediaSrc(html) {
  return transformImages(html, (img) => img.removeAttribute('src'))
}

/**
 * Terapkan `fn` ke setiap string di struktur JSON (objek/array bersarang).
 * Dipakai untuk membersihkan/mengisi gambar di seluruh `content` soal.
 */
export function mapStrings(value, fn) {
  if (typeof value === 'string') return fn(value)
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fn))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]))
  }
  return value
}

/** ID media dari semua string HTML di struktur JSON. */
export function mediaIdsInJson(value) {
  const ids = new Set()
  mapStrings(value, (text) => {
    mediaIdsIn(text).forEach((id) => ids.add(id))
    return text
  })
  return [...ids]
}
