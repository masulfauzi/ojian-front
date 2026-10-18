// Semua pemetaan kontrak endpoint /schedules (jadwal MENGAJAR, bukan jadwal ujian) ada di file ini.
// Sumber: Swagger exam-api — tag "Jadwal Mengajar" (teachingschedule.SlotRequest, SlotResponse,
// GenerateRequest, PreviewResponse, GenerateResponse, ClassScheduleResponse). Berbasis semester.
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'
import { toSemesterRef, unwrapItems } from './journal.api'

const FIELD_MAP = {
  class_id: 'classId',
  subject_id: 'subjectId',
  teacher_id: 'teacherId',
  day_of_week: 'dayOfWeek',
  period_from: 'periodFrom',
  period_to: 'periodTo',
  min_occurrences: 'minOccurrences',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = ({ schoolId, semesterId } = {}, params = {}) => {
  const out = { ...params }
  if (schoolId) out.school_id = schoolId
  if (semesterId) out.semester_id = semesterId
  return out
}

const toRef = (data) => (data ? { id: data.id, name: data.name } : null)

export const toSlot = (data) => ({
  id: data.id,
  teacher: toRef(data.teacher),
  class: toRef(data.class),
  subject: toRef(data.subject),
  dayOfWeek: data.day_of_week,
  dayName: data.day_name ?? '',
  periodFrom: data.period_from,
  periodTo: data.period_to,
  /** generated | manual */
  source: data.source,
  isLocked: Boolean(data.is_locked),
  occurrences: data.occurrences ?? null,
  firstDate: data.first_date ?? null,
  lastDate: data.last_date ?? null,
  updatedAt: data.updated_at ?? null,
})

export const toCandidate = (data) => ({
  teacherId: data.teacher_id ?? null,
  teacherName: data.teacher_name ?? '',
  classId: data.class_id ?? null,
  className: data.class_name ?? '',
  subjectId: data.subject_id ?? null,
  subjectName: data.subject_name ?? '',
  dayOfWeek: data.day_of_week,
  dayName: data.day_name ?? '',
  periodFrom: data.period_from,
  periodTo: data.period_to,
  occurrences: data.occurrences ?? 0,
  firstDate: data.first_date ?? null,
  lastDate: data.last_date ?? null,
  /** Hanya pada `rejected`: below_threshold | conflict | conflict_with_manual. */
  reason: data.reason ?? null,
  conflictWith: data.conflict_with
    ? {
        scheduleId: data.conflict_with.schedule_id ?? null,
        className: data.conflict_with.class_name ?? '',
        periodFrom: data.conflict_with.period_from,
        periodTo: data.conflict_with.period_to,
      }
    : null,
})

const toPreview = (data) => ({
  semester: toSemesterRef(data.semester),
  minOccurrences: data.min_occurrences,
  accepted: (data.accepted ?? []).map(toCandidate),
  rejected: (data.rejected ?? []).map(toCandidate),
})

const toGenerateResult = (data) => ({
  semester: toSemesterRef(data.semester),
  minOccurrences: data.min_occurrences,
  teachers: data.teachers ?? 0,
  created: data.created ?? 0,
  removed: data.removed ?? 0,
  rejectedBelowThreshold: data.rejected_below_threshold ?? 0,
  rejectedConflict: data.rejected_conflict ?? 0,
})

/** Body slot; `teacherId` hanya untuk admin. Field kosong tidak dikirim (UpdateSlotRequest). */
export function toSlotBody(values) {
  const body = {}
  if (values.teacherId) body.teacher_id = values.teacherId
  if (values.classId) body.class_id = values.classId
  if (values.subjectId) body.subject_id = values.subjectId
  if (values.dayOfWeek) body.day_of_week = values.dayOfWeek
  if (values.periodFrom) body.period_from = values.periodFrom
  if (values.periodTo) body.period_to = values.periodTo
  if (typeof values.isLocked === 'boolean') body.is_locked = values.isLocked
  return body
}

const generateBody = ({ minOccurrences, teacherIds } = {}) => {
  const body = {}
  if (minOccurrences) body.min_occurrences = minOccurrences
  if (teacherIds?.length) body.teacher_ids = teacherIds
  return body
}

// ---- Guru ----

export async function listMySchedule(options = {}) {
  const res = await http.get('/schedules/me', { params: scoped(options) })
  return unwrapItems(res, toSlot)
}

export async function previewMyGenerate(values = {}, options = {}) {
  const res = await http
    .post('/schedules/me/generate/preview', generateBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toPreview(unwrap(res) ?? {})
}

export async function generateMy(values = {}, options = {}) {
  const res = await http
    .post('/schedules/me/generate', generateBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toGenerateResult(unwrap(res) ?? {})
}

export async function createMySlot(values, options = {}) {
  const res = await http
    .post('/schedules/me', toSlotBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toSlot(unwrap(res))
}

export async function updateMySlot(id, values) {
  const res = await http.put(`/schedules/me/${id}`, toSlotBody(values)).catch(rethrow)
  return toSlot(unwrap(res))
}

export async function deleteMySlot(id) {
  await http.delete(`/schedules/me/${id}`)
}

// ---- Admin ----

export async function listSchedules({ teacherId, classId, dayOfWeek, ...options } = {}) {
  const params = {}
  if (teacherId) params.teacher_id = teacherId
  if (classId) params.class_id = classId
  if (dayOfWeek) params.day_of_week = dayOfWeek
  const res = await http.get('/schedules', { params: scoped(options, params) })
  return unwrapItems(res, toSlot)
}

export async function getClassSchedule(classId, options = {}) {
  const res = await http.get(`/schedules/class/${classId}`, { params: scoped(options) })
  const data = unwrap(res) ?? {}
  return {
    class: toRef(data.class),
    semester: toSemesterRef(data.semester),
    slots: (data.days ?? []).flatMap((day) => (day.slots ?? []).map(toSlot)),
  }
}

export async function previewGenerate(values = {}, options = {}) {
  const res = await http
    .post('/schedules/generate/preview', generateBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toPreview(unwrap(res) ?? {})
}

export async function generate(values = {}, options = {}) {
  const res = await http
    .post('/schedules/generate', generateBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toGenerateResult(unwrap(res) ?? {})
}

export async function createSlot(values, options = {}) {
  const res = await http
    .post('/schedules', toSlotBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toSlot(unwrap(res))
}

export async function updateSlot(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/schedules/${id}`, toSlotBody(values), { params: scoped({ schoolId }) })
    .catch(rethrow)
  return toSlot(unwrap(res))
}

export async function deleteSlot(id, { schoolId } = {}) {
  await http.delete(`/schedules/${id}`, { params: scoped({ schoolId }) })
}
