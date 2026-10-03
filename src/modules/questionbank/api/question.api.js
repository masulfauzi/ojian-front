// Semua pemetaan kontrak endpoint /questions dan /question-types ada di file ini.
// Sumber: Swagger exam-api — tag "Bank Soal"; format content/answer_key per jenis di ojian-back/soal.md §6.
// `content`/`answer_key` dikirim apa adanya (bentuk backend) setelah src gambar unggahan dibuang.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'
import { mapStrings, stripMediaSrc } from '@/shared/utils/mediaHtml'

// Field metadata → nama field form; path konten (content.*, answer_key.*, scoring.*) dibiarkan
// apa adanya dan ditampilkan editor jenis soal.
const FIELD_MAP = {
  type_code: 'typeCode',
  subject_id: 'subjectId',
  grade_level: 'gradeLevel',
  default_points: 'defaultPoints',
  cognitive_level: 'cognitiveLevel',
  stimulus_id: 'stimulusId',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const QUESTION_STATUSES = [
  { value: 'draft', label: 'Draf', severity: 'secondary' },
  { value: 'active', label: 'Aktif', severity: 'success' },
  { value: 'archived', label: 'Arsip', severity: 'warn' },
]
export const statusOf = (value) =>
  QUESTION_STATUSES.find((s) => s.value === value) ?? { value, label: value }

export const toQuestionType = (data) => ({
  code: data.code,
  name: data.name,
  grading: data.grading,
})

export const toListItem = (data) => ({
  id: data.id,
  typeCode: data.type_code,
  subjectId: data.subject_id,
  subjectName: data.subject_name ?? null,
  gradeLevel: data.grade_level ?? null,
  difficulty: data.difficulty ?? null,
  topic: data.topic ?? null,
  tags: data.tags ?? [],
  status: data.status,
  visibility: data.visibility,
  versionNo: data.version_no,
  preview: data.preview ?? '',
  defaultPoints: data.default_points ?? 1,
  createdBy: data.created_by,
  creatorName: data.creator_name ?? null,
  canEdit: Boolean(data.can_edit),
  createdAt: data.created_at,
})

export const toVersion = (data) => ({
  id: data.id,
  versionNo: data.version_no,
  content: data.content ?? {},
  answerKey: data.answer_key ?? {},
  scoring: data.scoring ?? null,
  explanation: data.explanation ?? '',
  defaultPoints: data.default_points ?? 1,
  stimulusId: data.stimulus_id ?? null,
  mediaIds: data.media_ids ?? [],
  isLocked: Boolean(data.is_locked),
  createdAt: data.created_at,
  createdBy: data.created_by,
})

export const toQuestion = (data) => ({
  id: data.id,
  schoolId: data.school_id,
  typeCode: data.type_code,
  subjectId: data.subject_id,
  gradeLevel: data.grade_level ?? null,
  difficulty: data.difficulty ?? null,
  cognitiveLevel: data.cognitive_level ?? null,
  topic: data.topic ?? null,
  tags: data.tags ?? [],
  status: data.status,
  visibility: data.visibility,
  copiedFromId: data.copied_from_id ?? null,
  createdBy: data.created_by,
  canEdit: Boolean(data.can_edit),
  currentVersion: data.current_version ? toVersion(data.current_version) : null,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

export const toVersionSummary = (data) => ({
  id: data.id,
  versionNo: data.version_no,
  isCurrent: Boolean(data.is_current),
  isLocked: Boolean(data.is_locked),
  defaultPoints: data.default_points,
  createdAt: data.created_at,
  createdBy: data.created_by,
})

/** Tampilan siswa: content teracak tanpa kunci + teks bacaan (bila ada). */
export const toStudentQuestion = (data) => ({
  versionId: data.question_version_id,
  type: data.type,
  content: data.content ?? {},
  stimulus: data.stimulus
    ? { id: data.stimulus.id, title: data.stimulus.title, body: data.stimulus.body }
    : null,
})

/** Buang src gambar unggahan di seluruh string HTML (URL bertanda tangan tidak disimpan). */
export const cleanJson = (value) => mapStrings(value, stripMediaSrc)

/**
 * Body tambah/ubah/validasi soal.
 * @param {object} values metadata (camelCase) + content/answerKey/scoring/explanation
 * @param {object} [options]
 * @param {boolean} [options.withType] sertakan type_code (tambah & validasi)
 */
export function toQuestionBody(values, { withType = false } = {}) {
  const body = {
    subject_id: values.subjectId,
    content: cleanJson(values.content),
    answer_key: cleanJson(values.answerKey),
  }
  if (withType) body.type_code = values.typeCode
  if (values.scoring) body.scoring = values.scoring
  const optional = {
    explanation: values.explanation ? stripMediaSrc(values.explanation) : null,
    default_points: values.defaultPoints,
    difficulty: values.difficulty,
    grade_level: values.gradeLevel,
    cognitive_level: values.cognitiveLevel,
    topic: values.topic,
    visibility: values.visibility,
    stimulus_id: values.stimulusId,
  }
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null && value !== undefined && value !== '') body[key] = value
  }
  if (values.tags?.length) body.tags = values.tags
  return body
}

export async function listQuestionTypes() {
  const res = await http.get('/question-types')
  return (unwrap(res) ?? []).map(toQuestionType)
}

export async function listQuestions({
  schoolId,
  page = 1,
  limit = 10,
  subjectId,
  typeCode,
  status,
  tags,
  search,
  mine,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (subjectId) params.subject_id = subjectId
  if (typeCode) params.type_code = typeCode
  if (status) params.status = status
  if (tags?.length) params.tags = tags.join(',')
  if (search) params.search = search
  if (mine) params.mine = true
  const res = await http.get('/questions', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toListItem), meta }
}

export async function getQuestion(id, { schoolId } = {}) {
  const res = await http.get(`/questions/${id}`, { params: scoped(schoolId) })
  return toQuestion(unwrap(res))
}

export async function createQuestion(values) {
  const res = await http
    .post('/questions', toQuestionBody(values, { withType: true }))
    .catch(rethrow)
  return toQuestion(unwrap(res))
}

/** Versi terkunci (sudah dipakai ujian) → backend membuat versi baru. */
export async function updateQuestion(id, values, { schoolId } = {}) {
  const res = await http
    .put(`/questions/${id}`, toQuestionBody(values), { params: scoped(schoolId) })
    .catch(rethrow)
  return toQuestion(unwrap(res))
}

export async function deleteQuestion(id, { schoolId } = {}) {
  await http.delete(`/questions/${id}`, { params: scoped(schoolId) })
}

/** Salin ke bank milik penyalin (versi 1, private, draft). */
export async function copyQuestion(id, { schoolId } = {}) {
  const res = await http.post(`/questions/${id}/copy`, null, { params: scoped(schoolId) })
  return toQuestion(unwrap(res))
}

export async function setQuestionStatus(id, status, { schoolId } = {}) {
  const res = await http.patch(`/questions/${id}/status`, { status }, { params: scoped(schoolId) })
  return toQuestion(unwrap(res))
}

export async function previewQuestion(id, { seed = 1, schoolId } = {}) {
  const res = await http.get(`/questions/${id}/preview`, { params: scoped(schoolId, { seed }) })
  return toStudentQuestion(unwrap(res))
}

export async function listVersions(id, { schoolId } = {}) {
  const res = await http.get(`/questions/${id}/versions`, { params: scoped(schoolId) })
  return (unwrap(res) ?? []).map(toVersionSummary)
}

export async function getVersion(id, no, { schoolId } = {}) {
  const res = await http.get(`/questions/${id}/versions/${no}`, { params: scoped(schoolId) })
  return toVersion(unwrap(res))
}

/** Sanitasi + validasi + pratinjau siswa tanpa menyimpan. */
export async function validateQuestion(values, { seed = 1 } = {}) {
  const body = { ...toQuestionBody(values, { withType: true }), preview_seed: seed }
  const res = await http.post('/questions/validate', body).catch(rethrow)
  const data = unwrap(res)
  return {
    valid: Boolean(data.valid),
    content: data.content,
    answerKey: data.answer_key,
    mediaIds: data.media_ids ?? [],
    preview: data.preview ? toStudentQuestion(data.preview) : null,
  }
}
