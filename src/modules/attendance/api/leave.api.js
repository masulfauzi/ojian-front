// Semua pemetaan kontrak endpoint /leaves (izin/sakit online) dan unggah bukti ada di file ini.
// Sumber: Swagger exam-api — tag "Izin Siswa" dan "Persetujuan Izin" (leave.CreateRequest,
// LeaveResponse, DecisionRequest, FileURLResponse) serta POST /media purpose=leave_proof.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  leave_type: 'leaveType',
  start_date: 'startDate',
  end_date: 'endDate',
  media_ids: 'mediaIds',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toLeaveFile = (data) => ({
  mediaId: data.media_id,
  originalName: data.original_name ?? 'berkas',
  mimeType: data.mime_type ?? '',
  sizeBytes: data.size_bytes ?? 0,
})

export const toLeave = (data) => ({
  id: data.id,
  student: data.student
    ? {
        id: data.student.id,
        name: data.student.name,
        nis: data.student.nis ?? null,
        className: data.student.class_name ?? null,
      }
    : null,
  leaveType: data.leave_type,
  startDate: data.start_date,
  endDate: data.end_date,
  days: data.days ?? null,
  reason: data.reason ?? '',
  status: data.status,
  files: (data.files ?? []).map(toLeaveFile),
  fileCount: data.file_count ?? data.files?.length ?? 0,
  submittedAt: data.submitted_at ?? null,
  decidedBy: data.decided_by ?? null,
  decidedAt: data.decided_at ?? null,
  decisionNote: data.decision_note ?? null,
  cancelledBy: data.cancelled_by ?? null,
  cancelledAt: data.cancelled_at ?? null,
  cancelNote: data.cancel_note ?? null,
  /** Hanya pada respons persetujuan. */
  appliedDays: data.applied_days ?? null,
})

export function toLeaveBody(values) {
  return {
    leave_type: values.leaveType,
    start_date: values.startDate,
    end_date: values.endDate,
    reason: values.reason,
    media_ids: values.mediaIds ?? [],
  }
}

// ---- Siswa ----

/** Unggah bukti izin (gambar diproses ulang tanpa metadata; PDF apa adanya). */
export async function uploadLeaveProof(file, { onProgress } = {}) {
  const form = new FormData()
  form.append('file', file)
  form.append('purpose', 'leave_proof')
  const res = await http.post('/media', form, {
    timeout: 120_000,
    onUploadProgress: (event) =>
      onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : null),
  })
  const data = unwrap(res)
  return {
    id: data.id,
    originalName: data.original_name ?? file.name,
    mimeType: data.mime_type,
    sizeBytes: data.size_bytes,
    url: data.url ?? null,
  }
}

export async function listMyLeaves({ page = 1, limit = 10 } = {}) {
  const res = await http.get('/leaves/me', { params: { page, limit } })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toLeave), meta }
}

export async function createLeave(values) {
  const res = await http.post('/leaves', toLeaveBody(values)).catch(rethrow)
  return toLeave(unwrap(res))
}

export async function cancelLeave(id) {
  const res = await http.post(`/leaves/${id}/cancel`)
  return toLeave(unwrap(res))
}

// ---- Bersama (pemilik atau admin presensi) ----

export async function getLeave(id, { schoolId } = {}) {
  const res = await http.get(`/leaves/${id}`, { params: scoped(schoolId) })
  return toLeave(unwrap(res))
}

/** URL bertanda tangan berumur pendek; PDF dipaksa diunduh oleh server. */
export async function getLeaveFileUrl(id, mediaId, { schoolId } = {}) {
  const res = await http.get(`/leaves/${id}/files/${mediaId}`, { params: scoped(schoolId) })
  const data = unwrap(res) ?? {}
  return { url: data.url, expiresAt: data.expires_at ?? null }
}

// ---- Admin presensi ----

export async function listLeaves({
  schoolId,
  status,
  classId,
  search,
  dateFrom,
  dateTo,
  page = 1,
  limit = 10,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (status) params.status = status
  if (classId) params.class_id = classId
  if (search) params.search = search
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo
  const res = await http.get('/leaves', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toLeave), meta }
}

const decide =
  (action) =>
  async (id, note, { schoolId } = {}) => {
    const res = await http
      .post(`/leaves/${id}/${action}`, note ? { note } : {}, { params: scoped(schoolId) })
      .catch(rethrow)
    return toLeave(unwrap(res))
  }

/** Setujui: respons memuat `appliedDays` (hari presensi yang diwujudkan). */
export const approveLeave = decide('approve')
/** Tolak: catatan wajib. */
export const rejectLeave = decide('reject')
/** Batalkan izin yang sudah disetujui: catatan wajib. */
export const revokeLeave = decide('revoke')
