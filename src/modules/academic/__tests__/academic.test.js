import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import {
  createAcademicYear,
  getActiveSemester,
  listAcademicYears,
  toYear,
} from '../api/academic.api'
import { createYearSchema, semesterDatesSchema, updateYearSchema } from '../schemas/academic.schema'
import { defaultYearDates, startYearOf, suggestStartYear, yearsFromSemesters } from '../utils/dates'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }
})

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('tanggal default tahun pelajaran', () => {
  it('defaultYearDates', () => {
    expect(defaultYearDates(2026)).toEqual({
      name: '2026/2027',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      ganjilStart: '2026-07-01',
      ganjilEnd: '2026-12-31',
      genapStart: '2027-01-01',
      genapEnd: '2027-06-30',
    })
  })

  it('suggestStartYear: setelah tahun terbaru, atau berdasarkan bulan berjalan', () => {
    expect(suggestStartYear(['2025/2026', '2026/2027'])).toBe(2027)
    expect(suggestStartYear([], new Date(2026, 2, 1))).toBe(2025)
    expect(suggestStartYear([], new Date(2026, 7, 1))).toBe(2026)
    expect(startYearOf('2026-2027')).toBeNull()
  })
})

describe('createYearSchema', () => {
  const valid = defaultYearDates(2026)

  it('menerima tanggal standar', () => {
    expect(createYearSchema.safeParse(valid).success).toBe(true)
  })

  it('nama harus YYYY/YYYY berurutan', () => {
    expect(errorsOf(createYearSchema, { ...valid, name: '2026-2027' }).name[0]).toMatch(/format/)
    expect(errorsOf(createYearSchema, { ...valid, name: '2026/2028' }).name).toEqual([
      'tahun kedua harus satu tahun setelah tahun pertama',
    ])
  })

  it('semester harus di dalam rentang dan Genap setelah Ganjil', () => {
    const errors = errorsOf(createYearSchema, {
      ...valid,
      ganjilStart: '2026-06-01',
      genapStart: '2026-12-01',
    })
    expect(errors.ganjilStart).toEqual(['harus di dalam rentang tahun pelajaran'])
    expect(errors.genapStart).toEqual(['semester Genap harus dimulai setelah Ganjil berakhir'])
  })

  it('tanggal wajib', () => {
    expect(errorsOf(createYearSchema, { ...valid, endDate: '' }).endDate).toContain('wajib diisi')
  })
})

describe('updateYearSchema & semesterDatesSchema', () => {
  const semesters = [
    { term: 1, termName: 'Ganjil', startDate: '2026-07-13', endDate: '2026-12-19' },
    { term: 2, termName: 'Genap', startDate: '2027-01-04', endDate: '2027-06-19' },
  ]

  it('rentang tahun harus memuat kedua semester', () => {
    const errors = errorsOf(updateYearSchema({ semesters }), {
      name: '2026/2027',
      startDate: '2026-08-01',
      endDate: '2027-06-01',
    })
    expect(errors.startDate).toEqual(['harus memuat tanggal mulai semester Ganjil'])
    expect(errors.endDate).toEqual(['harus memuat tanggal selesai semester Genap'])
  })

  it('tanggal semester tidak boleh keluar rentang atau beririsan', () => {
    const year = { startDate: '2026-07-01', endDate: '2027-06-30' }
    const schema = semesterDatesSchema({ year, other: semesters[1] })
    expect(schema.safeParse({ startDate: '2026-07-13', endDate: '2026-12-31' }).success).toBe(true)
    expect(errorsOf(schema, { startDate: '2026-07-13', endDate: '2027-01-10' }).startDate).toEqual([
      'beririsan dengan semester Genap',
    ])
    expect(errorsOf(schema, { startDate: '2026-06-01', endDate: '2026-12-01' }).startDate).toEqual([
      'harus di dalam rentang tahun pelajaran',
    ])
  })
})

describe('academic api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('school_id hanya dikirim bila ada', async () => {
    http.get.mockResolvedValue({ data: { data: [], meta: {} } })
    await listAcademicYears({ limit: 100 })
    expect(http.get).toHaveBeenLastCalledWith('/academic-years', {
      params: { page: 1, limit: 100 },
    })
    await listAcademicYears({ schoolId: 's1' })
    expect(http.get).toHaveBeenLastCalledWith('/academic-years', {
      params: { page: 1, limit: 10, school_id: 's1' },
    })
  })

  it('createAcademicYear mengirim dua semester', async () => {
    http.post.mockResolvedValue({ data: { data: { id: 'y', name: '2026/2027', semesters: [] } } })
    await createAcademicYear(defaultYearDates(2026), { schoolId: 's1' })
    expect(http.post).toHaveBeenCalledWith('/academic-years', {
      name: '2026/2027',
      start_date: '2026-07-01',
      end_date: '2027-06-30',
      semesters: [
        { term: 1, start_date: '2026-07-01', end_date: '2026-12-31' },
        { term: 2, start_date: '2027-01-01', end_date: '2027-06-30' },
      ],
      school_id: 's1',
    })
  })

  it('getActiveSemester: 404 → null, error lain dilempar', async () => {
    http.get.mockRejectedValueOnce(new ApiError({ status: 404, message: 'tidak ada' }))
    expect(await getActiveSemester()).toBeNull()
    http.get.mockRejectedValueOnce(new ApiError({ status: 500, message: 'x' }))
    await expect(getActiveSemester()).rejects.toMatchObject({ status: 500 })
  })

  it('toYear mengurutkan semester Ganjil lalu Genap', () => {
    const year = toYear({
      id: 'y',
      name: '2026/2027',
      semesters: [
        { id: 'b', term: 2, term_name: 'Genap' },
        { id: 'a', term: 1, term_name: 'Ganjil', is_active: true },
      ],
    })
    expect(year.semesters.map((s) => s.id)).toEqual(['a', 'b'])
    expect(year.semesters[0].isActive).toBe(true)
  })
})

describe('yearsFromSemesters (pengguna tanpa hak tahun pelajaran)', () => {
  const sem = (id, yearId, term, startDate, endDate, isActive = false) => ({
    id,
    academicYearId: yearId,
    term,
    termName: term === 1 ? 'Ganjil' : 'Genap',
    startDate,
    endDate,
    isActive,
  })

  it('mengelompokkan per tahun, menurunkan nama dari tanggal, terbaru lebih dulu', () => {
    const years = yearsFromSemesters([
      sem('a2', 'y1', 2, '2027-01-04', '2027-06-19'),
      sem('a1', 'y1', 1, '2026-07-13', '2026-12-19'),
      sem('b1', 'y2', 1, '2027-07-12', '2027-12-18', true),
    ])
    expect(years.map((y) => [y.name, y.isActive, y.semesters.map((s) => s.id)])).toEqual([
      ['2027/2028', true, ['b1']],
      ['2026/2027', false, ['a1', 'a2']],
    ])
    expect(years[1]).toMatchObject({ startDate: '2026-07-13', endDate: '2027-06-19' })
  })

  it('nama tahun aktif diambil dari /semesters/active; tanpa Ganjil memakai tahun Genap − 1', () => {
    const years = yearsFromSemesters([sem('g', 'y9', 2, '2030-01-06', '2030-06-20', true)], {
      academicYearId: 'y9',
      academicYearName: 'TP 2029/2030',
    })
    expect(years[0].name).toBe('TP 2029/2030')
    expect(yearsFromSemesters([sem('g', 'y9', 2, '2030-01-06', '2030-06-20')])[0].name).toBe(
      '2029/2030',
    )
  })
})
