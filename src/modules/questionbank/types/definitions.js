// Registri jenis soal (bagian tanpa komponen). Bentuk content/answer_key mengikuti
// ojian-back/soal.md §6; batas jumlah elemen mengikuti grader backend.
import { emptyBlank, emptyBlankKey } from './fillBlank'
import { makeElements } from './ids'

export const DEFAULT_MATCH = {
  case_sensitive: false,
  trim: true,
  collapse_spaces: true,
  ignore_diacritics: false,
}
const DEFAULT_LABELS = { true: 'Benar', false: 'Salah' }

const textOf = (elements, id) => elements?.find((e) => e.id === id)?.text ?? `<em>(${id})</em>`
const yesNo = (labels, value) => (value ? (labels?.true ?? 'Benar') : (labels?.false ?? 'Salah'))

/**
 * Setiap jenis: label, ikon, dukungan skor parsial/penalti, batas elemen, nilai awal,
 * dan ringkasan kunci untuk guru (describeKey → [{ label, html }]).
 */
export const QUESTION_TYPES = {
  single_choice: {
    label: 'Pilihan Ganda',
    icon: 'pi pi-circle',
    partial: false,
    penalty: true,
    limits: { options: [2, 10] },
    empty: () => ({
      content: { prompt: '', options: makeElements('o', 4), shuffle_options: true },
      answerKey: { correct: null },
    }),
    describeKey: (c, k) => [{ label: 'Jawaban benar', html: textOf(c.options, k.correct) }],
  },
  multiple_choice: {
    label: 'Pilihan Ganda Kompleks',
    icon: 'pi pi-check-square',
    partial: true,
    penalty: true,
    limits: { options: [2, 10] },
    empty: () => ({
      content: {
        prompt: '',
        options: makeElements('o', 4),
        shuffle_options: true,
        min_select: 1,
        max_select: 0,
      },
      answerKey: { correct: [] },
    }),
    describeKey: (c, k) =>
      (k.correct ?? []).map((id) => ({ label: 'Benar', html: textOf(c.options, id) })),
  },
  true_false: {
    label: 'Benar/Salah',
    icon: 'pi pi-thumbs-up',
    partial: false,
    penalty: true,
    empty: () => ({
      content: { prompt: '', labels: { ...DEFAULT_LABELS } },
      answerKey: { correct: true },
    }),
    describeKey: (c, k) => [{ label: 'Jawaban benar', html: yesNo(c.labels, k.correct) }],
  },
  true_false_group: {
    label: 'Benar/Salah Majemuk',
    icon: 'pi pi-list-check',
    partial: true,
    penalty: false,
    limits: { statements: [1, 20] },
    empty: () => ({
      content: {
        prompt: '',
        labels: { ...DEFAULT_LABELS },
        statements: makeElements('s', 3),
        shuffle_statements: false,
      },
      answerKey: { correct: { s1: true, s2: true, s3: true } },
    }),
    describeKey: (c, k) =>
      (c.statements ?? []).map((s) => ({
        label: yesNo(c.labels, k.correct?.[s.id]),
        html: s.text,
      })),
  },
  matching: {
    label: 'Menjodohkan',
    icon: 'pi pi-arrow-right-arrow-left',
    partial: true,
    penalty: false,
    limits: { left: [1, 20], right: [1, 30] },
    empty: () => ({
      content: {
        prompt: '',
        left: makeElements('l', 3),
        right: makeElements('r', 3),
        allow_reuse: false,
      },
      answerKey: { pairs: { l1: 'r1', l2: 'r2', l3: 'r3' } },
    }),
    describeKey: (c, k) =>
      (c.left ?? []).map((l) => ({ label: l.text, html: textOf(c.right, k.pairs?.[l.id]) })),
  },
  ordering: {
    label: 'Mengurutkan',
    icon: 'pi pi-sort-amount-down',
    partial: true,
    penalty: false,
    limits: { items: [2, 20] },
    empty: () => ({
      content: { prompt: '', items: makeElements('i', 4), direction: 'vertical' },
      answerKey: { order: ['i1', 'i2', 'i3', 'i4'] },
    }),
    describeKey: (c, k) =>
      (k.order ?? []).map((id, i) => ({ label: `${i + 1}.`, html: textOf(c.items, id) })),
  },
  categorize: {
    label: 'Pengelompokan',
    icon: 'pi pi-th-large',
    partial: true,
    penalty: false,
    limits: { categories: [2, 10], items: [1, 30] },
    empty: () => ({
      content: {
        prompt: '',
        categories: [
          { id: 'c1', label: '' },
          { id: 'c2', label: '' },
        ],
        items: makeElements('i', 4),
      },
      answerKey: { placement: { i1: 'c1', i2: 'c1', i3: 'c2', i4: 'c2' } },
    }),
    describeKey: (c, k) =>
      (c.categories ?? []).map((cat) => ({
        label: cat.label,
        html: (c.items ?? [])
          .filter((item) => k.placement?.[item.id] === cat.id)
          .map((item) => item.text)
          .join(' · '),
      })),
  },
  short_answer: {
    label: 'Isian Singkat',
    icon: 'pi pi-pencil',
    partial: false,
    penalty: false,
    empty: () => ({
      content: { prompt: '', placeholder: 'Jawaban singkat', max_length: 100 },
      answerKey: { accepted: [], match: { ...DEFAULT_MATCH } },
    }),
    describeKey: (_c, k) => [{ label: 'Jawaban diterima', html: (k.accepted ?? []).join(' · ') }],
  },
  numeric: {
    label: 'Isian Angka',
    icon: 'pi pi-calculator',
    partial: false,
    penalty: false,
    empty: () => ({
      content: { prompt: '', unit_label: '' },
      answerKey: { value: null, tolerance: 0, tolerance_type: 'absolute' },
    }),
    describeKey: (c, k) => [
      {
        label: 'Jawaban benar',
        html: `${k.value ?? '-'}${c.unit_label ? ` ${c.unit_label}` : ''}${
          k.tolerance ? ` (± ${k.tolerance}${k.tolerance_type === 'percent' ? '%' : ''})` : ''
        }`,
      },
    ],
  },
  fill_blank: {
    label: 'Melengkapi Rumpang',
    icon: 'pi pi-ellipsis-h',
    partial: true,
    penalty: false,
    limits: { blanks: [1, 20] },
    empty: () => ({
      content: {
        prompt: '',
        template: '<p>Ibu kota Indonesia adalah {{b1}}.</p>',
        blanks: [emptyBlank('b1')],
      },
      answerKey: { blanks: { b1: emptyBlankKey('text') } },
    }),
    describeKey: (c, k) =>
      (c.blanks ?? []).map((b) => ({
        label: `{{${b.id}}}`,
        html:
          b.kind === 'select'
            ? textOf(b.options, k.blanks?.[b.id]?.correct)
            : (k.blanks?.[b.id]?.accepted ?? []).join(' · '),
      })),
  },
  essay: {
    label: 'Uraian',
    icon: 'pi pi-align-left',
    partial: false,
    penalty: false,
    limits: { rubric: [1, 10] },
    empty: () => ({
      content: { prompt: '', max_length: 3000 },
      answerKey: {
        model_answer: '',
        rubric: [{ id: 'k1', criterion: '', max_points: 1 }],
        keywords: [],
      },
    }),
    describeKey: (_c, k) => [
      ...(k.model_answer ? [{ label: 'Jawaban model', html: k.model_answer }] : []),
      ...(k.rubric ?? []).map((r) => ({ label: `${r.max_points} poin`, html: r.criterion })),
    ],
  },
}

export const typeOf = (code) => QUESTION_TYPES[code] ?? null
export const typeLabel = (code) => QUESTION_TYPES[code]?.label ?? code

/** Mode skor yang tersedia untuk jenis soal. */
export function scoringOptions(code) {
  const type = typeOf(code)
  return [
    { value: 'all_or_nothing', label: 'Semua atau tidak sama sekali' },
    ...(type?.partial ? [{ value: 'partial', label: 'Parsial (proporsional)' }] : []),
  ]
}

/**
 * Objek scoring untuk dikirim, atau null bila default (all_or_nothing tanpa penalti) atau
 * jenis tidak mendukung pengaturan skor.
 */
export function buildScoring(code, { mode = 'all_or_nothing', wrongPenalty = 0 } = {}) {
  const type = typeOf(code)
  if (!type) return null
  const scoring = {}
  if (mode === 'partial' && type.partial) scoring.mode = 'partial'
  if (type.penalty && wrongPenalty > 0) {
    scoring.mode = scoring.mode ?? 'all_or_nothing'
    scoring.wrong_penalty = wrongPenalty
  }
  return Object.keys(scoring).length ? scoring : null
}
