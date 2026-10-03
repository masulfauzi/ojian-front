import { mapStrings, mediaIdsIn, mediaIdsInJson, withMediaUrls } from '@/shared/utils/mediaHtml'
import { getMedia } from '../api/media.api'

// Cache URL bertanda tangan per media, dipakai bersama semua komponen.
// Entri dianggap basi 60 detik sebelum `url_expires_at`.
const cache = new Map()
const pending = new Map()
const MARGIN_MS = 60_000

const fresh = (entry) => entry && (!entry.expiresAt || entry.expiresAt - MARGIN_MS > Date.now())

/** Simpan URL media yang baru diunggah (tanpa perlu GET ulang). */
export function rememberMedia(media) {
  cache.set(media.id, {
    url: media.url,
    expiresAt: media.urlExpiresAt ? Date.parse(media.urlExpiresAt) : null,
  })
}

async function fetchOne(id, schoolId) {
  if (!pending.has(id)) {
    pending.set(
      id,
      getMedia(id, { schoolId })
        .then(rememberMedia)
        .catch(() => cache.set(id, { url: null, expiresAt: Date.now() + MARGIN_MS * 2 }))
        .finally(() => pending.delete(id)),
    )
  }
  return pending.get(id)
}

/** Pastikan URL tersedia untuk semua ID; hasil { id: url }. */
export async function ensureMediaUrls(ids, { schoolId } = {}) {
  await Promise.all(ids.filter((id) => !fresh(cache.get(id))).map((id) => fetchOne(id, schoolId)))
  return Object.fromEntries(ids.map((id) => [id, cache.get(id)?.url]).filter(([, url]) => url))
}

/** Isi src gambar unggahan di satu potong HTML. */
export async function resolveMediaHtml(html, options) {
  const ids = mediaIdsIn(html)
  if (!ids.length) return html ?? ''
  return withMediaUrls(html, await ensureMediaUrls(ids, options))
}

/** Isi src gambar unggahan di seluruh string HTML pada struktur JSON (content soal). */
export async function resolveMediaJson(value, options) {
  const ids = mediaIdsInJson(value)
  if (!ids.length) return value
  const urls = await ensureMediaUrls(ids, options)
  return mapStrings(value, (text) =>
    text.includes('data-media-id') ? withMediaUrls(text, urls) : text,
  )
}
