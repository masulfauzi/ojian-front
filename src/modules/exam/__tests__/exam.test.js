import { describe, expect, it } from 'vitest'
import { toExam, toExamBody, toQuestionItems } from '../api/exam.api'
import { examSchema } from '../schemas/exam.schema'
import {
  addQuestions,
  compositionKey,
  flattenGroups,
  groupBySection,
  totalPoints,
} from '../utils/composition'

const SECTIONS = [
  { no: 1, title: 'PG', instruction: '' },
  { no: 2, title: 'Uraian', instruction: '' },
]
const q = (questionId, sectionNo, points = 1) => ({ questionId, sectionNo, points })

describe('exam.api', () => {
  it('body paket: nomor bagian = urutan, tingkat opsional', () => {
    expect(
      toExamBody({
        title: 'PTS',
        subjectId: 's1',
        description: '',
        gradeLevel: null,
        sections: [{ title: 'A' }, { title: 'B', instruction: 'Jawab' }],
      }),
    ).toEqual({
      title: 'PTS',
      subject_id: 's1',
      description: '',
      sections: [
        { no: 1, title: 'A', instruction: '' },
        { no: 2, title: 'B', instruction: 'Jawab' },
      ],
    })
  })

  it('soal paket: urutan array = urutan soal', () => {
    expect(toQuestionItems([q('a', 1, 2), q('b', 2, 4)])).toEqual({
      items: [
        { question_id: 'a', section_no: 1, points: 2 },
        { question_id: 'b', section_no: 2, points: 4 },
      ],
    })
  })

  it('memetakan respons detail', () => {
    const exam = toExam({
      id: 'e',
      title: 'T',
      status: 'draft',
      total_points: '8',
      sections: [{ no: 1, title: 'A', instruction: null }],
      questions: [{ id: 'x', question_id: 'a', type_code: 'essay', points: '4', section_no: 1 }],
      can_edit: true,
    })
    expect(exam.totalPoints).toBe(8)
    expect(exam.sections[0].instruction).toBe('')
    expect(exam.questions[0]).toMatchObject({ questionId: 'a', points: 4, typeCode: 'essay' })
    expect(toExam({ id: 'e', title: 'T' }).questions).toBeNull()
  })

  it('schema menolak judul pendek dan mapel kosong', () => {
    const result = examSchema.safeParse({ title: 'ab', subjectId: '', sections: [] })
    expect(result.success).toBe(false)
    const fields = result.error.issues.map((i) => i.path[0])
    expect(fields).toEqual(expect.arrayContaining(['title', 'subjectId']))
  })
})

describe('composition', () => {
  it('kelompok per bagian lalu rata kembali dengan posisi baru', () => {
    const groups = groupBySection(SECTIONS, [q('a', 1), q('b', 2), q('c', 1)])
    expect(groups.map((g) => g.questions.map((x) => x.questionId))).toEqual([['a', 'c'], ['b']])
    // Seret "b" ke bagian 1.
    groups[0].questions.push(groups[1].questions.pop())
    const flat = flattenGroups(groups)
    expect(flat.map((x) => [x.questionId, x.sectionNo, x.position])).toEqual([
      ['a', 1, 1],
      ['c', 1, 2],
      ['b', 1, 3],
    ])
    expect(groupBySection([], [q('a', 1)])[0].questions).toHaveLength(1)
  })

  it('menambah soal bank di akhir bagian tujuan tanpa duplikat', () => {
    const current = [q('a', 1), q('b', 2)]
    const picked = [
      { id: 'a', typeCode: 'essay', defaultPoints: 3 },
      { id: 'n', typeCode: 'single_choice', defaultPoints: 2, preview: 'Soal baru' },
    ]
    const next = addQuestions(current, picked, 1)
    expect(next.map((x) => x.questionId)).toEqual(['a', 'n', 'b'])
    expect(next[1]).toMatchObject({ sectionNo: 1, points: 2, position: 2 })
    expect(totalPoints(next)).toBe(4)
    expect(compositionKey(next)).not.toBe(compositionKey(current))
  })
})
