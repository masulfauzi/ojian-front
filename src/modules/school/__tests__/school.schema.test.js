import { describe, expect, it } from 'vitest'
import { createSchoolSchema, updateSchoolSchema } from '../schemas/school.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = {
  code: 'sman1-jkt',
  name: 'SMA Negeri 1 Jakarta',
  npsn: '',
  educationLevel: 'SMA',
  ownership: null,
  address: '',
  city: '',
  province: '',
  postalCode: '',
  phone: '',
  email: '',
  logoUrl: '',
}

describe('createSchoolSchema', () => {
  it('menerima data minimal; field opsional kosong menjadi null', () => {
    const result = createSchoolSchema.parse(valid)
    expect(result).toMatchObject({ npsn: null, ownership: null, email: null, logoUrl: null })
  })

  it('kode dinormalisasi huruf kecil dan harus cocok format', () => {
    expect(createSchoolSchema.parse({ ...valid, code: 'SMAN1-JKT' }).code).toBe('sman1-jkt')
    expect(errorsOf(createSchoolSchema, { ...valid, code: 'sma n1' }).code[0]).toMatch(
      /huruf kecil/,
    )
    expect(errorsOf(createSchoolSchema, { ...valid, code: 'ab' }).code).toContain(
      'minimal 3 karakter',
    )
  })

  it('NPSN harus 8 digit angka bila diisi', () => {
    expect(createSchoolSchema.safeParse({ ...valid, npsn: '20100001' }).success).toBe(true)
    expect(errorsOf(createSchoolSchema, { ...valid, npsn: '1234' }).npsn).toEqual([
      'NPSN harus 8 digit angka',
    ])
  })

  it('jenjang wajib dan harus salah satu jenjang yang dikenal', () => {
    expect(errorsOf(createSchoolSchema, { ...valid, educationLevel: null }).educationLevel).toEqual(
      ['wajib diisi'],
    )
    expect(
      errorsOf(createSchoolSchema, { ...valid, educationLevel: 'TK' }).educationLevel[0],
    ).toMatch(/harus salah satu dari/)
  })

  it('email dan URL logo divalidasi bila diisi', () => {
    const errors = errorsOf(createSchoolSchema, { ...valid, email: 'x@', logoUrl: 'logo.png' })
    expect(errors.email).toEqual(['format email tidak valid'])
    expect(errors.logoUrl[0]).toMatch(/http/)
  })
})

describe('updateSchoolSchema', () => {
  it('memerlukan status aktif', () => {
    expect(updateSchoolSchema.safeParse({ ...valid, isActive: false }).success).toBe(true)
    expect(errorsOf(updateSchoolSchema, valid).isActive).toEqual(['wajib diisi'])
  })
})
