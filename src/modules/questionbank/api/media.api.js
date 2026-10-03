// Pemetaan kontrak endpoint /media (tag "Media"). Unggahan hanya untuk pengguna sekolah.
import { http, unwrap } from '@/shared/api/http'

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toMedia = (data) => ({
  id: data.id,
  url: data.url,
  urlExpiresAt: data.url_expires_at ?? null,
  mimeType: data.mime_type,
  originalName: data.original_name,
  sizeBytes: data.size_bytes,
  width: data.width ?? null,
  height: data.height ?? null,
})

/** Unggah gambar soal. Tipe divalidasi backend dari isi file (SVG ditolak). */
export async function uploadMedia(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await http.post('/media', form, { timeout: 60_000 })
  return toMedia(unwrap(res))
}

/** Metadata + URL bertanda tangan berumur pendek. */
export async function getMedia(id, { schoolId } = {}) {
  const res = await http.get(`/media/${id}`, { params: scoped(schoolId) })
  return toMedia(unwrap(res))
}

export async function deleteMedia(id, { schoolId } = {}) {
  await http.delete(`/media/${id}`, { params: scoped(schoolId) })
}
