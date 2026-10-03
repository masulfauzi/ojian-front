// Semua pemetaan kontrak hasil & penilaian ujian ada di file ini.
// Sumber: Swagger exam-api — tag "Jadwal Ujian" (results) dan "Penilaian"
// (grading/queue, answers/{attempt}/{question}/score, exam-questions/{id}/analysis|regrade).
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const rethrow = (error) => {
  throw remapFieldErrors(error, { question_version_id: 'questionVersionId' })
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)
const num = (value) => (value === null || value === undefined ? null : Number(value))

export const GRADING_STATUSES = {
  pending: { label: 'Menunggu penilaian', severity: 'warn' },
  partial: { label: 'Sebagian dinilai', severity: 'warn' },
  complete: { label: 'Selesai dinilai', severity: 'success' },
}
export const gradingStatusOf = (value) =>
  GRADING_STATUSES[value] ?? { label: value ?? '-', severity: 'secondary' }

export const toResultItem = (data) => ({
  studentId: data.student_id,
  name: data.name,
  nis: data.nis ?? null,
  className: data.class_name ?? null,
  attemptId: data.attempt_id ?? null,
  attemptNo: data.attempt_no ?? null,
  totalScore: num(data.total_score),
  maxScore: num(data.max_score),
  scorePercent: num(data.score_percent),
  gradingStatus: data.grading_status ?? null,
  /** null = belum ada nilai / KKM tidak diatur. */
  passed: data.passed ?? null,
  submittedAt: data.submitted_at ?? null,
})

export const toResults = (data) => ({
  scorePolicy: data.score_policy,
  passingScore: num(data.passing_score),
  resultsPublishedAt: data.results_published_at ?? null,
  summary: {
    participants: data.summary?.participants ?? 0,
    submitted: data.summary?.submitted ?? 0,
    pendingGrading: data.summary?.pending_grading ?? 0,
    averagePercent: num(data.summary?.average_percent),
    passed: data.summary?.passed ?? 0,
  },
  items: (data.items ?? []).map(toResultItem),
})

export const toQueueItem = (data) => ({
  attemptId: data.attempt_id,
  examQuestionId: data.exam_question_id,
  scheduleId: data.schedule_id,
  scheduleTitle: data.schedule_title ?? '',
  studentName: data.student_name,
  nis: data.nis ?? null,
  number: data.number,
  type: data.type,
  questionVersionId: data.question_version_id,
  content: data.content ?? {},
  answerKey: data.answer_key ?? {},
  answer: data.answer ?? null,
  gradingStatus: data.grading_status,
  autoScore: num(data.auto_score),
  maxScore: num(data.max_score) ?? 0,
})

export const toAnalysis = (data) => ({
  examQuestionId: data.exam_question_id,
  type: data.type,
  total: data.total ?? 0,
  unanswered: data.unanswered ?? 0,
  /** 0 sulit … 1 mudah; null bila belum ada jawaban. */
  difficultyIndex: num(data.difficulty_index),
  distribution: (data.distribution ?? []).map((d) => ({ optionId: d.option_id, total: d.total })),
})

export async function getResults(scheduleId, { schoolId } = {}) {
  const res = await http.get(`/exam-schedules/${scheduleId}/results`, {
    params: scoped(schoolId),
  })
  return toResults(unwrap(res))
}

/** Jawaban yang perlu dinilai guru (pending / needs_review) pada pengerjaan yang dikumpulkan. */
export async function listGradingQueue({
  schoolId,
  scheduleId,
  examQuestionId,
  page = 1,
  limit = 20,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (scheduleId) params.schedule_id = scheduleId
  if (examQuestionId) params.exam_question_id = examQuestionId
  const res = await http.get('/grading/queue', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toQueueItem), meta }
}

/**
 * Skor guru: `criteria` ({ idKriteria: nilai }) untuk rubrik uraian, selain itu `score`.
 * Mengembalikan keadaan pengerjaan setelah skor disimpan.
 */
export async function scoreAnswer(
  attemptId,
  examQuestionId,
  { score, criteria, feedback },
  { schoolId } = {},
) {
  const body = {}
  if (criteria) body.criteria = criteria
  else body.score = score
  if (feedback) body.feedback = feedback
  const res = await http
    .put(`/answers/${attemptId}/${examQuestionId}/score`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  const data = unwrap(res) ?? {}
  return {
    manualScore: num(data.manual_score),
    maxScore: num(data.max_score),
    gradingStatus: data.grading_status,
    attemptGradingStatus: data.attempt_grading_status,
    attemptTotalScore: num(data.attempt_total_score),
  }
}

export async function getAnalysis(examQuestionId, { schoolId } = {}) {
  const res = await http.get(`/exam-questions/${examQuestionId}/analysis`, {
    params: scoped(schoolId),
  })
  return toAnalysis(unwrap(res))
}

/**
 * Koreksi kunci: arahkan soal paket ke versi pengganti (konten identik) lalu nilai ulang semua
 * jawaban di semua jadwal paket itu. Tanpa versi = nilai ulang dengan versi saat ini.
 */
export async function regradeQuestion(
  examQuestionId,
  { questionVersionId } = {},
  { schoolId } = {},
) {
  const body = questionVersionId ? { question_version_id: questionVersionId } : {}
  const res = await http
    .post(`/exam-questions/${examQuestionId}/regrade`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  const data = unwrap(res) ?? {}
  return { regraded: data.regraded ?? 0, attempts: data.attempts ?? 0 }
}
