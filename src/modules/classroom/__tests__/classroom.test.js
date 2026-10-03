import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api/http'
import { createClass, promote } from '../api/classroom.api'
import { copyClassesSchema, createClassSchema } from '../schemas/class.schema'
import {
  GRADUATE,
  SKIP,
  buildPromotionPayload,
  classSuffix,
  mappingsComplete,
  suggestTarget,
  summarizePromotion,
} from '../utils/promotion'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }
})

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('class schema', () => {
  it('nama, tingkat 1–13, dan tahun pelajaran wajib', () => {
    expect(
      createClassSchema.safeParse({ name: 'X-1', gradeLevel: 10, academicYearId: 'y' }).success,
    ).toBe(true)
    const errors = errorsOf(createClassSchema, { name: '', gradeLevel: 14, academicYearId: null })
    expect(errors.name).toEqual(['wajib diisi'])
    expect(errors.gradeLevel).toEqual(['maksimal 13'])
    expect(errors.academicYearId).toEqual(['wajib diisi'])
  })

  it('salin kelas: tahun asal harus berbeda', () => {
    expect(errorsOf(copyClassesSchema, { fromYearId: 'a', toYearId: 'a' }).fromYearId).toEqual([
      'pilih tahun pelajaran lain',
    ])
  })
})

describe('saran kelas tujuan', () => {
  const toClasses = [
    { id: 'xi-rpl1', name: 'XI RPL 1', gradeLevel: 11 },
    { id: 'xi-rpl2', name: 'XI RPL 2', gradeLevel: 11 },
    { id: 'viii-a', name: 'VIII-A', gradeLevel: 8 },
  ]

  it('classSuffix membuang penanda tingkat', () => {
    expect(classSuffix('X RPL 1')).toBe('rpl 1')
    expect(classSuffix('VII-A')).toBe('a')
  })

  it('tingkat+1 dengan akhiran sama', () => {
    expect(suggestTarget({ name: 'X RPL 2', gradeLevel: 10 }, toClasses)).toBe('xi-rpl2')
    expect(suggestTarget({ name: 'VII-A', gradeLevel: 7 }, toClasses)).toBe('viii-a')
  })

  it('beberapa kandidat tanpa akhiran cocok → null; tingkat akhir tanpa kandidat → Lulus', () => {
    expect(suggestTarget({ name: 'X TKJ 1', gradeLevel: 10 }, toClasses)).toBeNull()
    expect(suggestTarget({ name: 'XII RPL 1', gradeLevel: 12 }, toClasses)).toBe(GRADUATE)
    expect(suggestTarget({ name: 'IX-A', gradeLevel: 9 }, toClasses)).toBe(GRADUATE)
    expect(suggestTarget({ name: 'IV-A', gradeLevel: 4 }, toClasses)).toBeNull()
  })
})

describe('payload kenaikan kelas', () => {
  const member = (id, extra = {}) => ({ studentId: id, include: true, override: null, ...extra })
  const base = {
    fromSemesterId: 'genap-1',
    toSemesterId: 'ganjil-2',
    activate: true,
  }

  it('semua siswa ikut: tanpa student_ids dan overrides; lewati tidak dikirim', () => {
    const payload = buildPromotionPayload({
      ...base,
      mappings: { x1: 'xi1', xii1: GRADUATE, kosong: SKIP },
      members: { x1: [member('a'), member('b')], xii1: [member('c')] },
    })
    expect(payload).toEqual({
      ...base,
      mappings: [
        { fromClassId: 'x1', toClassId: 'xi1' },
        { fromClassId: 'xii1', toClassId: null },
      ],
      studentIds: undefined,
      overrides: [],
    })
  })

  it('siswa dikecualikan → student_ids berisi yang ikut; override hanya bila berbeda', () => {
    const payload = buildPromotionPayload({
      ...base,
      mappings: { x1: 'xi1', xii1: GRADUATE },
      members: {
        x1: [
          member('a'),
          member('b', { include: false }),
          member('c', { override: 'x1-baru' }),
          member('d', { override: 'xi1' }),
        ],
        xii1: [member('e')],
      },
    })
    expect(payload.studentIds).toEqual(['a', 'c', 'd', 'e'])
    expect(payload.overrides).toEqual([{ studentId: 'c', toClassId: 'x1-baru' }])
  })

  it('kelas yang semua siswanya dikecualikan tidak dikirim (student_ids kosong berarti semua)', () => {
    const payload = buildPromotionPayload({
      ...base,
      mappings: { x1: 'xi1', x2: 'xi2' },
      members: { x1: [member('a', { include: false })], x2: [member('b')] },
    })
    expect(payload.mappings).toEqual([{ fromClassId: 'x2', toClassId: 'xi2' }])
    expect(payload.studentIds).toBeUndefined()
  })

  it('summarizePromotion dan mappingsComplete', () => {
    const state = {
      mappings: { x1: 'xi1', xii1: GRADUATE },
      members: {
        x1: [member('a'), member('b', { include: false }), member('c', { override: 'x1' })],
        xii1: [member('d'), member('e', { override: 'xii-ulang' })],
      },
    }
    expect(summarizePromotion(state)).toEqual({
      promoted: 1,
      graduated: 1,
      redirected: 2,
      excluded: 1,
    })
    const classes = [{ id: 'x1' }, { id: 'xii1' }]
    expect(mappingsComplete(classes, { x1: 'xi1' })).toBe(false)
    expect(mappingsComplete(classes, { x1: SKIP, xii1: SKIP })).toBe(false)
    expect(mappingsComplete(classes, { x1: SKIP, xii1: GRADUATE })).toBe(true)
  })
})

describe('classroom api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('promote memetakan payload ke body backend', async () => {
    http.post.mockResolvedValue({ data: { data: { promoted: 2, graduated: 1, skipped: 0 } } })
    const result = await promote(
      {
        fromSemesterId: 'f',
        toSemesterId: 't',
        mappings: [
          { fromClassId: 'x1', toClassId: 'xi1' },
          { fromClassId: 'xii1', toClassId: null },
        ],
        studentIds: ['a', 'b'],
        overrides: [{ studentId: 'b', toClassId: 'x1' }],
        activate: true,
      },
      { schoolId: 's1' },
    )
    expect(http.post).toHaveBeenCalledWith('/promotions', {
      from_semester_id: 'f',
      to_semester_id: 't',
      mappings: [{ from_class_id: 'x1', to_class_id: 'xi1' }, { from_class_id: 'xii1' }],
      activate: true,
      student_ids: ['a', 'b'],
      overrides: [{ student_id: 'b', to_class_id: 'x1' }],
      school_id: 's1',
    })
    expect(result).toEqual({ promoted: 2, graduated: 1, skipped: 0 })
  })

  it('createClass tanpa wali kelas tidak mengirim homeroom_user_id', async () => {
    http.post.mockResolvedValue({ data: { data: { id: 'c', grade_level: 10 } } })
    await createClass({ name: 'X-1', gradeLevel: 10, academicYearId: 'y', homeroomUserId: null })
    expect(http.post).toHaveBeenCalledWith('/classes', {
      name: 'X-1',
      grade_level: 10,
      academic_year_id: 'y',
    })
  })
})
