import { describe, expect, it } from 'vitest'
import { createMenuSchema, updateMenuSchema } from '../schemas/menu.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const page = {
  code: 'question_bank',
  name: 'Bank Soal',
  type: 'page',
  path: '/question-bank',
  icon: 'pi pi-book',
  parentId: null,
  sortOrder: 10,
}

describe('menu schema', () => {
  it('menerima halaman valid', () => {
    expect(createMenuSchema.safeParse(page).success).toBe(true)
  })

  it('halaman wajib punya path yang diawali "/"', () => {
    expect(errorsOf(createMenuSchema, { ...page, path: '' }).path).toEqual([
      'wajib diisi untuk halaman',
    ])
    expect(errorsOf(createMenuSchema, { ...page, path: 'bank' }).path).toEqual([
      'harus diawali "/"',
    ])
  })

  it('grup tidak memerlukan path', () => {
    expect(createMenuSchema.safeParse({ ...page, type: 'group', path: '' }).success).toBe(true)
  })

  it('kode mengikuti format backend', () => {
    expect(createMenuSchema.safeParse({ ...page, code: 'exam.publish' }).success).toBe(true)
    expect(errorsOf(createMenuSchema, { ...page, code: 'Bank Soal' }).code[0]).toMatch(/diawali/)
  })

  it('urutan wajib bilangan bulat ≥ 0', () => {
    expect(errorsOf(createMenuSchema, { ...page, sortOrder: -1 }).sortOrder).toEqual(['minimal 0'])
    expect(errorsOf(createMenuSchema, { ...page, sortOrder: null }).sortOrder).toEqual([
      'wajib diisi',
    ])
  })

  it('update memerlukan status aktif', () => {
    expect(updateMenuSchema.safeParse({ ...page, isActive: true }).success).toBe(true)
  })
})
