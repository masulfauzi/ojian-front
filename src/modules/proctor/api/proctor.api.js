// Semua pemetaan kontrak pemantauan ujian ada di file ini.
// Sumber: Swagger exam-api — tag "Jadwal Ujian" (token, monitor) dan "Pengawasan Ujian"
// (attempt.ExtraTimeRequest, VoidRequest, AttemptSummary).
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const rethrow = (error) => {
  throw remapFieldErrors(error, {})
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toToken = (data) => ({
  token: data.token,
  tokenLength: data.token_length,
  rotateMinutes: data.token_rotate_minutes ?? null,
  /** null bila token tetap. */
  secondsLeft: data.seconds_left ?? null,
  serverTime: data.server_time,
})

export const toMonitorItem = (data) => ({
  studentId: data.student_id,
  name: data.name,
  nis: data.nis ?? null,
  className: data.class_name ?? null,
  extraTimeMinutes: data.extra_time_minutes ?? 0,
  /** not_started | in_progress | submitted */
  state: data.state,
  attemptId: data.attempt_id ?? null,
  attemptNo: data.attempt_no ?? null,
  startedAt: data.started_at ?? null,
  deadlineAt: data.deadline_at ?? null,
  submittedAt: data.submitted_at ?? null,
  answered: data.answered ?? 0,
})

export const toMonitor = (data) => ({
  serverTime: data.server_time,
  timeState: data.time_state,
  questionCount: data.question_count ?? 0,
  summary: {
    total: data.summary?.total ?? 0,
    notStarted: data.summary?.not_started ?? 0,
    inProgress: data.summary?.in_progress ?? 0,
    submitted: data.summary?.submitted ?? 0,
  },
  items: (data.items ?? []).map(toMonitorItem),
})

export async function getToken(scheduleId, { schoolId } = {}) {
  const res = await http.get(`/exam-schedules/${scheduleId}/token`, { params: scoped(schoolId) })
  return toToken(unwrap(res))
}

/** Ganti rahasia token; siswa yang sudah mulai tidak terpengaruh. */
export async function regenerateToken(scheduleId, { schoolId } = {}) {
  const res = await http.post(`/exam-schedules/${scheduleId}/token/regenerate`, null, {
    params: scoped(schoolId),
  })
  return toToken(unwrap(res))
}

export async function getMonitor(scheduleId, { schoolId } = {}) {
  const res = await http.get(`/exam-schedules/${scheduleId}/monitor`, {
    params: scoped(schoolId),
  })
  return toMonitor(unwrap(res))
}

export async function addExtraTime(attemptId, minutes, { schoolId } = {}) {
  const res = await http
    .patch(`/attempts/${attemptId}/extra-time`, { minutes }, { params: scoped(schoolId) })
    .catch(rethrow)
  return unwrap(res)
}

export async function forceSubmit(attemptId, { schoolId } = {}) {
  const res = await http.post(`/attempts/${attemptId}/force-submit`, null, {
    params: scoped(schoolId),
  })
  return unwrap(res)
}

/** Reset: pengerjaan ditandai voided dan siswa mendapat satu kesempatan tambahan. */
export async function voidAttempt(attemptId, reason, { schoolId } = {}) {
  const res = await http
    .post(`/attempts/${attemptId}/void`, { reason }, { params: scoped(schoolId) })
    .catch(rethrow)
  return unwrap(res)
}
