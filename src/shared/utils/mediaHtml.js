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

export const MISSING_MEDIA_CLASS = 'media-missing'
export const MISSING_MEDIA_ALT = 'Gambar tidak dapat dimuat'

/**
 * Isi src gambar ber-data-media-id dari peta { mediaId: url }. Gambar tanpa URL (gagal dimuat
 * atau pengguna tidak berhak) ditandai sebagai placeholder: kelas `media-missing` + teks alt.
 */
export function withMediaUrls(html, urls) {
  return transformImages(html, (img) => {
    const url = urls[img.getAttribute('data-media-id')]
    if (url) {
      img.setAttribute('src', url)
      return
    }
    img.classList.add(MISSING_MEDIA_CLASS)
    if (!img.getAttribute('alt')) img.setAttribute('alt', MISSING_MEDIA_ALT)
  })
}

/** Buang src dan tanda placeholder gambar ber-data-media-id (URL bertanda tangan tidak boleh tersimpan). */
export function stripMediaSrc(html) {
  return transformImages(html, (img) => {
    img.removeAttribute('src')
    if (img.classList.contains(MISSING_MEDIA_CLASS)) {
      img.classList.remove(MISSING_MEDIA_CLASS)
      if (!img.classList.length) img.removeAttribute('class')
      if (img.getAttribute('alt') === MISSING_MEDIA_ALT) img.removeAttribute('alt')
    }
  })
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
