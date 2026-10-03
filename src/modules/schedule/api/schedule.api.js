// Semua pemetaan kontrak endpoint /exam-schedules (jadwal, kelas target, peserta) ada di file ini.
// Sumber: Swagger exam-api — tag "Jadwal Ujian" (schedule.ScheduleRequest/Response,
// ParticipantResponse, ClassesResponse, RemedialRequest). Desain: ojian-back/jadwal-ujian.md.
// Waktu dikirim RFC 3339 dengan offset zona sekolah (lihat shared/utils/zonedTime).
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'
import { DEFAULT_TIMEZONE } from '@/shared/constants/timezones'

const FIELD_MAP = {
  exam_id: 'examId',
  semester_id: 'semesterId',
  starts_at: 'startsAt',
  ends_at: 'endsAt',
  duration_minutes: 'durationMinutes',
  hard_deadline: 'hardDeadline',
  shuffle_questions: 'shuffleQuestions',
  shuffle_options: 'shuffleOptions',
  token_enabled: 'tokenEnabled',
  token_length: 'tokenLength',
  token_rotate_minutes: 'tokenRotateMinutes',
  max_attempts: 'maxAttempts',
  score_policy: 'scorePolicy',
  passing_score: 'passingScore',
  result_visibility: 'resultVisibility',
  review_visibility: 'reviewVisibility',
  class_ids: 'classIds',
  student_id: 'studentId',
  extra_time_minutes: 'extraTimeMinutes',
  extra_attempts: 'extraAttempts',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toScheduleClass = (data) => ({
  id: data.id,
  name: data.name,
  gradeLevel: data.grade_level ?? null,
})

export const toSchedule = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  examId: data.exam_id,
  examTitle: data.exam_title ?? '',
  subjectId: data.subject_id ?? null,
  subjectName: data.subject_name ?? null,
  semesterId: data.semester_id,
  academicYearId: data.academic_year_id ?? null,
  title: data.title,
  category: data.category ?? 'other',
  remedialOfScheduleId: data.remedial_of_schedule_id ?? null,
  timezone: data.timezone || DEFAULT_TIMEZONE,
  startsAt: data.starts_at,
  endsAt: data.ends_at,
  durationMinutes: data.duration_minutes,
  hardDeadline: data.hard_deadline ?? true,
  shuffleQuestions: Boolean(data.shuffle_questions),
  shuffleOptions: Boolean(data.shuffle_options),
  tokenEnabled: Boolean(data.token_enabled),
  tokenLength: data.token_length ?? 6,
  tokenRotateMinutes: data.token_rotate_minutes ?? null,
  maxAttempts: data.max_attempts ?? 1,
  scorePolicy: data.score_policy ?? 'best',
  passingScore: data.passing_score ?? null,
  resultVisibility: data.result_visibility ?? 'hidden',
  reviewVisibility: data.review_visibility ?? 'hidden',
  status: data.status,
  timeState: data.time_state,
  hasAttempts: Boolean(data.has_attempts),
  publishedAt: data.published_at ?? null,
  resultsPublishedAt: data.results_published_at ?? null,
  createdBy: data.created_by,
  creatorName: data.creator_name ?? null,
  canEdit: Boolean(data.can_edit),
  classes: (data.classes ?? []).map(toScheduleClass),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

export const toParticipant = (data) => ({
  studentId: data.student_id,
  name: data.name,
  nis: data.nis ?? null,
  nisn: data.nisn ?? null,
  classId: data.class_id ?? null,
  className: data.class_name ?? null,
  source: data.source ?? 'class',
  status: data.status ?? 'eligible',
  extraTimeMinutes: data.extra_time_minutes ?? 0,
  extraAttempts: data.extra_attempts ?? 0,
  note: data.note ?? '',
  attempts: data.attempts ?? 0,
  preview: Boolean(data.preview),
})

const toConflict = (data) => ({
  id: data.id,
  title: data.title,
  startsAt: data.starts_at,
  endsAt: data.ends_at,
})

/** Body ScheduleRequest. Rotasi token kosong = token tetap. */
export function toScheduleBody(values) {
  const body = {
    exam_id: values.examId,
    semester_id: values.semesterId,
    title: values.title,
    category: values.category,
    starts_at: values.startsAt,
    ends_at: values.endsAt,
    duration_minutes: values.durationMinutes,
    hard_deadline: values.hardDeadline,
    shuffle_questions: values.shuffleQuestions,
    shuffle_options: values.shuffleOptions,
    token_enabled: values.tokenEnabled,
    max_attempts: values.maxAttempts,
    score_policy: values.scorePolicy,
    result_visibility: values.resultVisibility,
    review_visibility: values.reviewVisibility,
  }
  if (values.tokenEnabled) {
    body.token_length = values.tokenLength
    if (values.tokenRotateMinutes) body.token_rotate_minutes = values.tokenRotateMinutes
  }
  if (values.passingScore !== null && values.passingScore !== undefined)
    body.passing_score = values.passingScore
  return body
}

export async function listSchedules({
  schoolId,
  page = 1,
  limit = 10,
  examId,
  semesterId,
  status,
  search,
  mine,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (examId) params.exam_id = examId
  if (semesterId) params.semester_id = semesterId
  if (status) params.status = status
  if (search) params.search = search
  if (mine) params.mine = true
  const res = await http.get('/exam-schedules', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toSchedule), meta }
}

export async function getSchedule(id, { schoolId } = {}) {
  const res = await http.get(`/exam-schedules/${id}`, { params: scoped(schoolId) })
  return toSchedule(unwrap(res))
}

export async function createSchedule(values, { schoolId } = {}) {
  const body = toScheduleBody(values)
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/exam-schedules', body).catch(rethrow)
  return toSchedule(unwrap(res))
}

export async function updateSchedule(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/exam-schedules/${id}`, toScheduleBody(values), { params: scoped(schoolId) })
    .catch(rethrow)
  return toSchedule(unwrap(res))
}

export async function deleteSchedule(id, { schoolId } = {}) {
  await http.delete(`/exam-schedules/${id}`, { params: scoped(schoolId) })
}

const action =
  (path) =>
  async (id, { schoolId } = {}) => {
    const res = await http.post(`/exam-schedules/${id}/${path}`, null, { params: scoped(schoolId) })
    return toSchedule(unwrap(res))
  }

/** Membentuk peserta dari kelas target. Tanpa peserta → ditolak. */
export const publishSchedule = action('publish')
export const cancelSchedule = action('cancel')
/** Mengisi results_published_at (visibilitas hasil "manual"). */
export const publishResults = action('results/publish')

export async function extendSchedule(id, endsAt, { schoolId } = {}) {
  const res = await http
    .post(`/exam-schedules/${id}/extend`, { ends_at: endsAt }, { params: scoped(schoolId) })
    .catch(rethrow)
  return toSchedule(unwrap(res))
}

/** Jadwal remedial (draft) dengan peserta di bawah batas nilai (kosong = KKM jadwal asal). */
export async function createRemedial(id, values, { schoolId } = {}) {
  const body = { starts_at: values.startsAt, ends_at: values.endsAt }
  if (values.title) body.title = values.title
  if (values.durationMinutes) body.duration_minutes = values.durationMinutes
  if (values.threshold !== null && values.threshold !== undefined) body.threshold = values.threshold
  const res = await http
    .post(`/exam-schedules/${id}/remedial`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toSchedule(unwrap(res))
}

/** Ganti kelas target; `warnings` = jadwal lain yang bentrok untuk kelas yang sama. */
export async function setScheduleClasses(id, classIds, { schoolId } = {}) {
  const res = await http
    .put(`/exam-schedules/${id}/classes`, { class_ids: classIds }, { params: scoped(schoolId) })
    .catch(rethrow)
  const data = unwrap(res) ?? {}
  return {
    classes: (data.classes ?? []).map(toScheduleClass),
    warnings: (data.warnings ?? []).map(toConflict),
  }
}

/** Jadwal draft: pratinjau dari kelas target (`preview: true`) + peserta manual. */
export async function listParticipants(id, { schoolId } = {}) {
  const res = await http.get(`/exam-schedules/${id}/participants`, { params: scoped(schoolId) })
  return (unwrap(res) ?? []).map(toParticipant)
}

export async function addParticipant(id, { studentId, note }, { schoolId } = {}) {
  const body = { student_id: studentId }
  if (note) body.note = note
  const res = await http
    .post(`/exam-schedules/${id}/participants`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toParticipant(unwrap(res))
}

export async function updateParticipant(id, studentId, values, { schoolId } = {}) {
  const body = {
    extra_time_minutes: values.extraTimeMinutes,
    extra_attempts: values.extraAttempts,
    status: values.status,
    note: values.note ?? '',
  }
  const res = await http
    .patch(`/exam-schedules/${id}/participants/${studentId}`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toParticipant(unwrap(res))
}

export async function syncParticipants(id, { schoolId } = {}) {
  const res = await http.post(`/exam-schedules/${id}/participants/sync`, null, {
    params: scoped(schoolId),
  })
  return { added: unwrap(res)?.added ?? 0 }
}
