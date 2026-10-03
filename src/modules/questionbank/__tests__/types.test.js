import { describe, expect, it } from 'vitest'
import { QUESTION_TYPES, buildScoring, scoringOptions, typeOf } from '../types/definitions'
import { blankIdsIn, splitTemplate, syncBlanks } from '../types/fillBlank'
import { nextId } from '../types/ids'
import { itemsInOrder, scramble } from '../types/ordering'

const ACTIVE = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'true_false_group',
  'matching',
  'ordering',
  'categorize',
  'short_answer',
  'numeric',
  'fill_blank',
  'essay',
]

describe('registri jenis soal', () => {
  it('mencakup ke-11 jenis aktif backend, masing-masing dengan nilai awal', () => {
    expect(Object.keys(QUESTION_TYPES).sort()).toEqual([...ACTIVE].sort())
    for (const code of ACTIVE) {
      const { content, answerKey } = typeOf(code).empty()
      expect(content).toHaveProperty('prompt', '')
      expect(answerKey).toBeTypeOf('object')
    }
  })

  it('nilai awal tidak berbagi referensi antar pemanggilan', () => {
    const a = typeOf('single_choice').empty()
    a.content.options.push({ id: 'x' })
    expect(typeOf('single_choice').empty().content.options).toHaveLength(4)
  })

  it('kunci awal konsisten dengan elemen konten', () => {
    const tfg = typeOf('true_false_group').empty()
    expect(Object.keys(tfg.answerKey.correct)).toEqual(tfg.content.statements.map((s) => s.id))
    const ord = typeOf('ordering').empty()
    expect(ord.answerKey.order).toEqual(ord.content.items.map((i) => i.id))
    const fb = typeOf('fill_blank').empty()
    expect(Object.keys(fb.answerKey.blanks)).toEqual(blankIdsIn(fb.content.template))
  })

  it('describeKey merangkum kunci', () => {
    const c = {
      options: [
        { id: 'o1', text: '<p>A</p>' },
        { id: 'o2', text: '<p>B</p>' },
      ],
    }
    expect(typeOf('single_choice').describeKey(c, { correct: 'o2' })).toEqual([
      { label: 'Jawaban benar', html: '<p>B</p>' },
    ])
    expect(
      typeOf('numeric').describeKey(
        { unit_label: 'cm' },
        { value: 154, tolerance: 1, tolerance_type: 'percent' },
      )[0].html,
    ).toBe('154 cm (± 1%)')
  })
})

describe('pengaturan skor', () => {
  it('mode parsial hanya untuk jenis yang mendukung', () => {
    expect(scoringOptions('single_choice').map((o) => o.value)).toEqual(['all_or_nothing'])
    expect(scoringOptions('matching').map((o) => o.value)).toEqual(['all_or_nothing', 'partial'])
  })

  it('buildScoring: default → null; parsial/penalti hanya bila didukung', () => {
    expect(buildScoring('single_choice', {})).toBeNull()
    expect(buildScoring('single_choice', { mode: 'partial' })).toBeNull()
    expect(buildScoring('single_choice', { wrongPenalty: 0.25 })).toEqual({
      mode: 'all_or_nothing',
      wrong_penalty: 0.25,
    })
    expect(buildScoring('multiple_choice', { mode: 'partial', wrongPenalty: 0.5 })).toEqual({
      mode: 'partial',
      wrong_penalty: 0.5,
    })
    expect(buildScoring('matching', { mode: 'partial', wrongPenalty: 0.5 })).toEqual({
      mode: 'partial',
    })
    expect(buildScoring('essay', { mode: 'partial' })).toBeNull()
  })
})

describe('utilitas', () => {
  it('nextId', () => {
    expect(nextId('o', [{ id: 'o1' }, { id: 'o3' }, { id: 'x9' }])).toBe('o4')
    expect(nextId('b', [])).toBe('b1')
  })

  it('scramble tidak pernah sama dengan urutan benar; itemsInOrder memulihkan urutan', () => {
    for (const order of [
      ['a', 'b'],
      ['a', 'b', 'c', 'd'],
    ]) {
      expect(scramble(order)).not.toEqual(order)
      expect([...scramble(order)].sort()).toEqual([...order].sort())
    }
    const items = [{ id: 'c' }, { id: 'a' }, { id: 'b' }]
    expect(itemsInOrder(items, ['a', 'b', 'c']).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('rumpang: ambil ID, sinkronkan daftar & kunci, potong template', () => {
    const template = '<p>{{b1}} dan {{ b3 }} lalu {{b1}}</p>'
    expect(blankIdsIn(template)).toEqual(['b1', 'b3'])
    const synced = syncBlanks(
      template,
      [
        { id: 'b1', kind: 'select', options: [] },
        { id: 'b2', kind: 'text' },
      ],
      {
        b1: { correct: 'o1' },
        b2: { accepted: ['x'] },
      },
    )
    expect(synced.blanks.map((b) => [b.id, b.kind])).toEqual([
      ['b1', 'select'],
      ['b3', 'text'],
    ])
    expect(synced.keyBlanks).toEqual({
      b1: { correct: 'o1' },
      b3: expect.objectContaining({ accepted: [] }),
    })
    expect(splitTemplate('<p>A {{b1}} B</p>')).toEqual([
      { html: '<p>A ' },
      { blankId: 'b1' },
      { html: ' B</p>' },
    ])
  })
})
