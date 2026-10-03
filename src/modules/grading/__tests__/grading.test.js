import { describe, expect, it } from 'vitest'
import { toQueueItem, toResults } from '../api/grading.api'
import {
  RESULT_COLUMNS,
  criteriaTotal,
  criteriaValid,
  difficultyLabel,
  resultRows,
  rubricOf,
} from '../utils/rubric'

describe('grading.api', () => {
  it('memetakan rekap nilai', () => {
    const results = toResults({
      score_policy: 'best',
      passing_score: 70,
      summary: {
        participants: 2,
        submitted: 1,
        pending_grading: 1,
        average_percent: 37.5,
        passed: 0,
      },
      items: [
        {
          student_id: 's',
          name: 'Siti',
          total_score: '3',
          max_score: 8,
          score_percent: 37.5,
          passed: false,
        },
      ],
    })
    expect(results.summary).toMatchObject({ pendingGrading: 1, averagePercent: 37.5 })
    expect(results.items[0]).toMatchObject({ totalScore: 3, passed: false, attemptId: null })
  })

  it('antrian: jawaban kosong tetap null', () => {
    expect(
      toQueueItem({ attempt_id: 'a', exam_question_id: 'q', type: 'essay', max_score: 4 }),
    ).toMatchObject({
      answer: null,
      autoScore: null,
      maxScore: 4,
    })
  })
})

describe('rubrik & rekap', () => {
  const rubric = rubricOf('essay', {
    rubric: [
      { id: 'r1', criterion: 'A', max_points: 2 },
      { id: 'r2', criterion: 'B', max_points: 2 },
    ],
  })

  it('kriteria harus lengkap dan dalam batas', () => {
    expect(rubricOf('short_answer', { accepted: ['x'] })).toEqual([])
    expect(criteriaValid(rubric, { r1: 2 })).toBe(false)
    expect(criteriaValid(rubric, { r1: 2, r2: 3 })).toBe(false)
    expect(criteriaValid(rubric, { r1: 2, r2: 0.5 })).toBe(true)
    expect(criteriaTotal({ r1: 2, r2: 0.5 })).toBe(2.5)
  })

  it('baris CSV rekap', () => {
    const rows = resultRows(
      [
        {
          name: 'Siti',
          nis: '1',
          attemptId: 'a',
          totalScore: 6,
          maxScore: 8,
          scorePercent: 75,
          passed: true,
          gradingStatus: 'complete',
        },
        {
          name: 'Budi',
          nis: '2',
          attemptId: null,
          totalScore: null,
          maxScore: null,
          scorePercent: null,
          passed: null,
        },
      ],
      (s) => `[${s}]`,
    )
    expect(rows[0]).toMatchObject({ passed: 'Lulus', status: '[complete]', percent: 75 })
    expect(rows[1]).toMatchObject({ passed: '', status: 'Belum mengerjakan', percent: '' })
    expect(Object.keys(rows[0])).toEqual(RESULT_COLUMNS.map((c) => c.key))
  })

  it('kategori indeks kesukaran', () => {
    expect(difficultyLabel(0.2).label).toBe('Sukar')
    expect(difficultyLabel(0.5).label).toBe('Sedang')
    expect(difficultyLabel(0.9).label).toBe('Mudah')
  })
})
