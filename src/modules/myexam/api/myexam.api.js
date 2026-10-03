// Semua pemetaan kontrak sisi siswa (Ujian Saya & pengerjaan) ada di file ini.
// Sumber: Swagger exam-api — tag "Pengerjaan Ujian" (attempt.MyExamResponse, AttemptView,
// SaveAnswerRequest/Response, AttemptSummary, ResultView). Jam server adalah acuan: sisa waktu
// selalu dari `remaining_seconds`, bukan jam perangkat.
import { http, unwrap } from '@/shared/api/http'

const num = (value) => (value === null || value === undefined ? null : Number(value))

export const toMyExam = (data) => ({
  scheduleId: data.schedule_id,
  title: data.title,
  examTitle: data.exam_title ?? '',
  subjectName: data.subject_name ?? null,
  timezone: data.timezone,
  startsAt: data.starts_at,
  endsAt: data.ends_at,
  durationMinutes: data.duration_minutes,
  tokenEnabled: Boolean(data.token_enabled),
  /** upcoming | open | finished */
  timeState: data.time_state,
  attemptsLeft: data.attempts_left ?? 0,
  attemptId: data.attempt_id ?? null,
  /** in_progress | submitted | voided | null */
  attemptStatus: data.attempt_status ?? null,
})

const toStimulus = (data) => (data ? { id: data.id, title: data.title, body: data.body } : null)

export const toAttemptQuestion = (data) => ({
  examQuestionId: data.exam_question_id,
  number: data.number,
  sectionNo: data.section_no ?? 1,
  points: num(data.points),
  type: data.type,
  content: data.content ?? {},
  stimulus: toStimulus(data.stimulus),
  answer: data.answer ?? null,
  isFlagged: Boolean(data.is_flagged),
})

export const toAttempt = (data) => ({
  id: data.id,
  scheduleId: data.schedule_id,
  title: data.title,
  attemptNo: data.attempt_no,
  status: data.status,
  startedAt: data.started_at,
  deadlineAt: data.deadline_at,
  submittedAt: data.submitted_at ?? null,
  serverTime: data.server_time,
  remainingSeconds: data.remaining_seconds ?? 0,
  answered: data.answered ?? 0,
  sections: (data.sections ?? []).map((s) => ({
    no: s.no,
    title: s.title ?? '',
    instruction: s.instruction ?? '',
  })),
  questions: (data.questions ?? []).map(toAttemptQuestion),
})

export const toAttemptSummary = (data) => ({
  id: data.id,
  status: data.status,
  submitReason: data.submit_reason ?? null,
  submittedAt: data.submitted_at ?? null,
  gradingStatus: data.grading_status ?? null,
})

export const toResult = (data) => ({
  attemptId: data.attempt_id,
  status: data.status,
  submittedAt: data.submitted_at ?? null,
  scoreVisible: Boolean(data.score_visible),
  gradingStatus: data.grading_status ?? null,
  message: data.message || '',
  totalScore: num(data.total_score),
  maxScore: num(data.max_score),
  scorePercent: num(data.score_percent),
  passed: data.passed ?? null,
  review: (data.review ?? []).map((r) => ({
    examQuestionId: r.exam_question_id,
    number: r.number,
    type: r.type,
    content: r.content ?? {},
    stimulus: toStimulus(r.stimulus),
    answer: r.answer ?? null,
    answerKey: r.answer_key ?? null,
    explanation: r.explanation ?? '',
    score: num(r.score),
    maxScore: num(r.max_score),
    gradingStatus: r.grading_status ?? null,
    feedback: r.feedback ?? '',
  })),
})

/** Jadwal milik siswa yang login (7 hari terakhir dan yang akan datang). */
export async function listMyExams() {
  const res = await http.get('/my-exams')
  return (unwrap(res) ?? []).map(toMyExam)
}

/**
 * Mulai (atau lanjutkan) pengerjaan. Token wajib bila jadwal memakai token; salah → 400 dengan
 * field `token`, terlalu sering salah → 429. Pengerjaan berjalan dikembalikan tanpa token.
 */
export async function startExam(scheduleId, token) {
  const body = token ? { token: token.trim().toUpperCase() } : {}
  const res = await http.post(`/exam-schedules/${scheduleId}/start`, body)
  return toAttempt(unwrap(res))
}

export async function getAttempt(id) {
  const res = await http.get(`/attempts/${id}`)
  return toAttempt(unwrap(res))
}

/** Autosave satu jawaban; `answer` null = mengosongkan. Setelah deadline (+10 dtk) → 409. */
export async function saveAnswer(attemptId, examQuestionId, { answer, isFlagged }) {
  const res = await http.put(`/attempts/${attemptId}/answers/${examQuestionId}`, {
    answer: answer ?? null,
    is_flagged: Boolean(isFlagged),
  })
  const data = unwrap(res) ?? {}
  return { savedAt: data.saved_at, remainingSeconds: data.remaining_seconds ?? null }
}

export async function submitAttempt(id) {
  const res = await http.post(`/attempts/${id}/submit`)
  return toAttemptSummary(unwrap(res))
}

export async function getAttemptResult(id) {
  const res = await http.get(`/attempts/${id}/result`)
  return toResult(unwrap(res))
}
