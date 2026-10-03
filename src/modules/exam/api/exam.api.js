// Semua pemetaan kontrak endpoint /exams ada di file ini.
// Sumber: Swagger exam-api — tag "Paket Ujian" (exam.ExamRequest, exam.ExamResponse,
// exam.SetQuestionsRequest). Desain: ojian-back/jadwal-ujian.md §2, §10.2.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = { subject_id: 'subjectId', grade_level: 'gradeLevel', school_id: 'schoolId' }

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const EXAM_STATUSES = [
  { value: 'draft', label: 'Draf', severity: 'secondary' },
  { value: 'published', label: 'Dipublikasikan', severity: 'success' },
  { value: 'archived', label: 'Diarsipkan', severity: 'warn' },
]
export const examStatusOf = (value) =>
  EXAM_STATUSES.find((s) => s.value === value) ?? { value, label: value, severity: 'secondary' }

const toSection = (data) => ({
  no: data.no,
  title: data.title ?? '',
  instruction: data.instruction ?? '',
})

export const toExamQuestion = (data) => ({
  id: data.id,
  questionId: data.question_id,
  questionVersionId: data.question_version_id,
  versionNo: data.version_no,
  typeCode: data.type_code,
  preview: data.preview ?? '',
  position: data.position,
  sectionNo: data.section_no ?? 1,
  points: Number(data.points ?? 0),
})

export const toExam = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  subjectId: data.subject_id,
  subjectName: data.subject_name ?? null,
  title: data.title,
  description: data.description ?? '',
  gradeLevel: data.grade_level ?? null,
  sections: (data.sections ?? []).map(toSection),
  status: data.status,
  questionCount: data.question_count ?? 0,
  totalPoints: Number(data.total_points ?? 0),
  publishedAt: data.published_at ?? null,
  createdBy: data.created_by,
  creatorName: data.creator_name ?? null,
  canEdit: Boolean(data.can_edit),
  // Hanya ada di detail.
  questions: data.questions ? data.questions.map(toExamQuestion) : null,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

/** Body ExamRequest. Bagian kosong = satu bagian tanpa judul (dibuat backend). */
export function toExamBody(values) {
  const body = {
    title: values.title,
    subject_id: values.subjectId,
    description: values.description || '',
    sections: (values.sections ?? []).map((section, index) => ({
      no: index + 1,
      title: section.title ?? '',
      instruction: section.instruction ?? '',
    })),
  }
  if (values.gradeLevel) body.grade_level = values.gradeLevel
  return body
}

/** Body SetQuestionsRequest: urutan array = urutan soal. */
export const toQuestionItems = (questions) => ({
  items: questions.map((q) => ({
    question_id: q.questionId,
    section_no: q.sectionNo,
    points: q.points,
  })),
})

export async function listExams({
  schoolId,
  page = 1,
  limit = 10,
  subjectId,
  status,
  search,
  mine,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (subjectId) params.subject_id = subjectId
  if (status) params.status = status
  if (search) params.search = search
  if (mine) params.mine = true
  const res = await http.get('/exams', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toExam), meta }
}

/** Paket yang bisa dijadwalkan (dipublikasikan), maks 100. */
export async function listExamOptions({ schoolId, search } = {}) {
  const { items } = await listExams({ schoolId, status: 'published', search, limit: 100 })
  return items
}

export async function getExam(id, { schoolId } = {}) {
  const res = await http.get(`/exams/${id}`, { params: scoped(schoolId) })
  return toExam(unwrap(res))
}

export async function createExam(values, { schoolId } = {}) {
  const body = toExamBody(values)
  if (schoolId) body.school_id = schoolId
  const res = await http.post('/exams', body).catch(rethrow)
  return toExam(unwrap(res))
}

export async function updateExam(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/exams/${id}`, toExamBody(values), { params: scoped(schoolId) })
    .catch(rethrow)
  return toExam(unwrap(res))
}

export async function deleteExam(id, { schoolId } = {}) {
  await http.delete(`/exams/${id}`, { params: scoped(schoolId) })
}

/**
 * Ganti seluruh soal paket draft. Error validasi per baris (`items[2].section_no`) dipetakan
 * ke `fieldErrors` dengan kunci yang sama untuk ditampilkan di baris terkait.
 */
export async function setExamQuestions(id, questions, { schoolId } = {}) {
  const res = await http.put(`/exams/${id}/questions`, toQuestionItems(questions), {
    params: scoped(schoolId),
  })
  return toExam(unwrap(res))
}

export async function publishExam(id, { schoolId } = {}) {
  const res = await http.post(`/exams/${id}/publish`, null, { params: scoped(schoolId) })
  return toExam(unwrap(res))
}

export async function archiveExam(id, { schoolId } = {}) {
  const res = await http.patch(`/exams/${id}/archive`, null, { params: scoped(schoolId) })
  return toExam(unwrap(res))
}

export async function duplicateExam(id, { schoolId } = {}) {
  const res = await http.post(`/exams/${id}/duplicate`, null, { params: scoped(schoolId) })
  return toExam(unwrap(res))
}
