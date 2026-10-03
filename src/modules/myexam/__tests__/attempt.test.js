import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/errors'
import * as api from '../api/myexam.api'
import { toAttempt, toMyExam } from '../api/myexam.api'
import { SAVE_DEBOUNCE_MS, useAttemptStore } from '../stores/attempt.store'
import { answerStats, isAnswered } from '../utils/answers'

vi.mock('../api/myexam.api', async (importOriginal) => ({
  ...(await importOriginal()),
  getAttempt: vi.fn(),
  saveAnswer: vi.fn(),
  submitAttempt: vi.fn(),
}))

const VIEW = toAttempt({
  id: 'att',
  status: 'in_progress',
  remaining_seconds: 1800,
  questions: [
    { exam_question_id: 'q1', number: 1, type: 'single_choice', content: {}, answer: null },
    {
      exam_question_id: 'q2',
      number: 2,
      type: 'essay',
      content: {},
      answer: { html: '<p>x</p>' },
      is_flagged: true,
    },
  ],
})

describe('isAnswered', () => {
  it.each([
    ['single_choice', { selected: 'a' }, true],
    ['single_choice', { selected: '' }, false],
    ['multiple_choice', { selected: [] }, false],
    ['multiple_choice', { selected: ['a'] }, true],
    ['true_false', { value: false }, true],
    ['true_false_group', { values: {} }, false],
    ['true_false_group', { values: { s1: true } }, true],
    ['matching', { pairs: { l1: 'r1' } }, true],
    ['ordering', { order: ['i2', 'i1'] }, true],
    ['categorize', { placement: {} }, false],
    ['short_answer', { text: '  ' }, false],
    ['numeric', { text: '12' }, true],
    ['fill_blank', { blanks: { b1: '' } }, false],
    ['fill_blank', { blanks: { b1: 'x' } }, true],
    ['essay', { html: '<p></p>' }, false],
    ['essay', { html: '<p>Jawab</p>' }, true],
    ['essay', null, false],
  ])('%s %j → %s', (type, answer, expected) => {
    expect(isAnswered(type, answer)).toBe(expected)
  })

  it('ringkasan untuk konfirmasi kumpulkan', () => {
    const questions = [
      { examQuestionId: 'a', type: 'single_choice' },
      { examQuestionId: 'b', type: 'essay' },
    ]
    expect(answerStats(questions, { a: { selected: 'x' } }, { b: true })).toEqual({
      total: 2,
      answered: 1,
      unanswered: 1,
      flagged: 1,
    })
  })

  it('memetakan Ujian Saya', () => {
    expect(
      toMyExam({ schedule_id: 's', time_state: 'open', attempts_left: 1, attempt_id: null }),
    ).toMatchObject({
      scheduleId: 's',
      attemptId: null,
      attemptStatus: null,
    })
  })
})

describe('attempt store (autosave)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(api.saveAnswer).mockReset()
    vi.mocked(api.submitAttempt).mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('init mengisi jawaban dan tanda ragu dari server', () => {
    const store = useAttemptStore()
    store.init(VIEW)
    expect(store.answers.q2).toEqual({ html: '<p>x</p>' })
    expect(store.flags.q2).toBe(true)
    expect(store.remainingSeconds).toBe(1800)
    expect(store.stats).toMatchObject({ answered: 1, flagged: 1 })
  })

  it('debounce: hanya jawaban terakhir yang dikirim', async () => {
    vi.mocked(api.saveAnswer).mockResolvedValue({ savedAt: 't', remainingSeconds: 1700 })
    const store = useAttemptStore()
    store.init(VIEW)
    store.setAnswer('q1', { selected: 'a' })
    store.setAnswer('q1', { selected: 'b' })
    expect(store.saveState.q1).toBe('saving')
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS)
    expect(api.saveAnswer).toHaveBeenCalledTimes(1)
    expect(api.saveAnswer).toHaveBeenCalledWith('att', 'q1', {
      answer: { selected: 'b' },
      isFlagged: false,
    })
    expect(store.saveState.q1).toBe('saved')
    expect(store.remainingSeconds).toBe(1700)
  })

  it('gagal jaringan dicoba ulang; 409 mengakhiri pengerjaan', async () => {
    vi.mocked(api.saveAnswer)
      .mockRejectedValueOnce(new ApiError({ status: 0, message: 'offline' }))
      .mockRejectedValueOnce(new ApiError({ status: 409, message: 'Waktu habis' }))
    const store = useAttemptStore()
    store.init(VIEW)
    store.toggleFlag('q1')
    await vi.advanceTimersByTimeAsync(0)
    expect(store.saveState.q1).toBe('error')
    await vi.advanceTimersByTimeAsync(2000)
    expect(api.saveAnswer).toHaveBeenCalledTimes(2)
    expect(store.ended).toBe(true)
    expect(store.endReason).toBe('expired')
  })

  it('kumpulkan mengirim jawaban tertunda lebih dulu', async () => {
    const order = []
    vi.mocked(api.saveAnswer).mockImplementation(async () => {
      order.push('save')
      return { savedAt: 't', remainingSeconds: 10 }
    })
    vi.mocked(api.submitAttempt).mockImplementation(async () => {
      order.push('submit')
      return { id: 'att', status: 'submitted' }
    })
    const store = useAttemptStore()
    store.init(VIEW)
    store.setAnswer('q1', { selected: 'c' })
    await store.submit()
    expect(order).toEqual(['save', 'submit'])
    expect(store.ended).toBe(true)
  })
})
