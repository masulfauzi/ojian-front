import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import { conflictField, listSubjects, updateSubject } from '../api/subject.api'
import { createSubjectSchema, updateSubjectSchema } from '../schemas/subject.schema'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }
})

describe('subject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('schema: kode 1–30, nama 2–150, status saat ubah', () => {
    expect(createSubjectSchema.safeParse({ code: 'MTK', name: 'Matematika' }).success).toBe(true)
    expect(createSubjectSchema.safeParse({ code: '', name: 'M' }).success).toBe(false)
    expect(updateSubjectSchema.safeParse({ code: 'MTK', name: 'Matematika' }).success).toBe(false)
  })

  it('api: filter dan body ubah', async () => {
    http.get.mockResolvedValue({
      data: { data: [{ id: '1', code: 'MTK', name: 'Matematika', is_active: true }], meta: {} },
    })
    const { items } = await listSubjects({ search: 'mat', isActive: false })
    expect(http.get.mock.calls[0][1].params).toEqual({
      page: 1,
      limit: 10,
      search: 'mat',
      is_active: false,
    })
    expect(items[0]).toMatchObject({ code: 'MTK', isActive: true })
    http.put.mockResolvedValue({ data: { data: { id: '1' } } })
    await updateSubject('1', { code: 'MTK', name: 'Mat', isActive: false })
    expect(http.put.mock.calls[0][1]).toEqual({ code: 'MTK', name: 'Mat', is_active: false })
  })

  it('conflictField', () => {
    expect(
      conflictField(new ApiError({ status: 409, message: 'Nama mata pelajaran sudah dipakai' })),
    ).toBe('name')
    expect(conflictField(new ApiError({ status: 409, message: 'Kode sudah dipakai' }))).toBe('code')
  })
})
