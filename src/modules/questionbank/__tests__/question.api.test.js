import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import {
  createQuestion,
  listQuestions,
  toQuestionBody,
  validateQuestion,
} from '../api/question.api'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

const ID = '3f1c2a4e-8b7d-4c1e-9a2f-6d5e4c3b2a10'
const values = {
  typeCode: 'single_choice',
  subjectId: 'sub',
  content: {
    prompt: `<p>Soal</p><img data-media-id="${ID}" src="http://minio/x?sig=1">`,
    options: [{ id: 'o1', text: '<p>A</p>' }],
  },
  answerKey: { correct: 'o1' },
  scoring: null,
  explanation: '',
  defaultPoints: 2,
  difficulty: 2,
  gradeLevel: null,
  cognitiveLevel: null,
  topic: null,
  tags: ['ipa'],
  visibility: 'school',
  stimulusId: null,
}

describe('question api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('toQuestionBody: snake_case, src gambar unggahan dibuang, nilai kosong tidak dikirim', () => {
    const body = toQuestionBody(values, { withType: true })
    expect(body).toEqual({
      type_code: 'single_choice',
      subject_id: 'sub',
      content: {
        prompt: `<p>Soal</p><img data-media-id="${ID}">`,
        options: [{ id: 'o1', text: '<p>A</p>' }],
      },
      answer_key: { correct: 'o1' },
      default_points: 2,
      difficulty: 2,
      visibility: 'school',
      tags: ['ipa'],
    })
    expect(toQuestionBody(values)).not.toHaveProperty('type_code')
  })

  it('error grader per path tetap, metadata dipetakan ke field form', async () => {
    http.post.mockRejectedValue(
      new ApiError({
        status: 400,
        message: 'Validasi gagal',
        fieldErrors: { 'content.options[1].text': 'wajib diisi', subject_id: 'tidak ditemukan' },
      }),
    )
    const error = await createQuestion(values).catch((e) => e)
    expect(error.fieldErrors).toEqual({
      'content.options[1].text': 'wajib diisi',
      subjectId: 'tidak ditemukan',
    })
  })

  it('validateQuestion mengirim preview_seed dan memetakan pratinjau', async () => {
    http.post.mockResolvedValue({
      data: {
        data: {
          valid: true,
          content: {},
          answer_key: {},
          media_ids: [ID],
          preview: { question_version_id: 'v', type: 'single_choice', content: { prompt: 'x' } },
        },
      },
    })
    const result = await validateQuestion(values, { seed: 7 })
    expect(http.post.mock.calls[0][1]).toMatchObject({
      preview_seed: 7,
      type_code: 'single_choice',
    })
    expect(result).toMatchObject({
      valid: true,
      mediaIds: [ID],
      preview: { type: 'single_choice', stimulus: null },
    })
  })

  it('listQuestions: tag digabung koma, mine hanya bila true', async () => {
    http.get.mockResolvedValue({ data: { data: [], meta: {} } })
    await listQuestions({ tags: ['a', 'b'], mine: true, status: 'active', schoolId: 's' })
    expect(http.get.mock.calls[0][1].params).toEqual({
      page: 1,
      limit: 10,
      tags: 'a,b',
      mine: true,
      status: 'active',
      school_id: 's',
    })
  })
})
