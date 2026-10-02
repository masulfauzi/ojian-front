import { describe, expect, it } from 'vitest'
import {
  STEP_FIELDS,
  emptyRegistration,
  registrationSchema,
  stepOfFields,
} from '../schemas/registration.schema'

const errorsOf = (value) => {
  const result = registrationSchema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = {
  ...emptyRegistration(),
  npsn: '20100001',
  schoolName: 'SMA Negeri 1 Jakarta',
  educationLevel: 'SMA',
  adminName: 'Budi Santoso',
  adminUsername: 'admin.sman1jkt',
  adminEmail: ' Admin@SMAN1JKT.sch.id ',
  password: 'rahasia123',
  confirmPassword: 'rahasia123',
}

describe('registrationSchema', () => {
  it('menerima data minimal; field opsional kosong menjadi null, email admin dinormalisasi', () => {
    const result = registrationSchema.parse(valid)
    expect(result.adminEmail).toBe('admin@sman1jkt.sch.id')
    expect(result).toMatchObject({
      ownership: null,
      city: null,
      schoolEmail: null,
      adminPhone: null,
    })
  })

  it('NPSN wajib 8 digit angka', () => {
    expect(errorsOf({ ...valid, npsn: '' }).npsn).toContain('wajib diisi')
    expect(errorsOf({ ...valid, npsn: '1234' }).npsn).toEqual(['NPSN harus 8 digit angka'])
    expect(errorsOf({ ...valid, npsn: '2010000A' }).npsn).toEqual(['NPSN harus 8 digit angka'])
  })

  it('field sekolah wajib: nama (min 3) dan jenjang', () => {
    const errors = errorsOf({ ...valid, schoolName: 'AB', educationLevel: null })
    expect(errors.schoolName).toEqual(['minimal 3 karakter'])
    expect(errors.educationLevel).toEqual(['wajib diisi'])
  })

  it('email admin wajib dan valid; email sekolah opsional tapi harus valid bila diisi', () => {
    expect(errorsOf({ ...valid, adminEmail: '' }).adminEmail).toContain('wajib diisi')
    expect(errorsOf({ ...valid, schoolEmail: 'info@' }).schoolEmail).toEqual([
      'format email tidak valid',
    ])
  })

  it('username admin mengikuti format backend', () => {
    expect(errorsOf({ ...valid, adminUsername: 'admin sekolah' }).adminUsername[0]).toMatch(
      /hanya huruf/,
    )
  })

  it('password 8–72 karakter dan konfirmasi harus sama', () => {
    expect(errorsOf({ ...valid, password: 'pendek', confirmPassword: 'pendek' }).password).toEqual([
      'minimal 8 karakter',
    ])
    expect(errorsOf({ ...valid, confirmPassword: 'lain12345' }).confirmPassword).toEqual([
      'konfirmasi password tidak cocok',
    ])
  })

  it('STEP_FIELDS mencakup semua field skema tepat sekali', () => {
    const shapeKeys = Object.keys(registrationSchema._def.schema.shape).sort()
    expect(STEP_FIELDS.flat().sort()).toEqual(shapeKeys)
  })

  it('stepOfFields menunjuk langkah pertama yang bermasalah', () => {
    expect(stepOfFields(['adminUsername'])).toBe(3)
    expect(stepOfFields(['adminEmail', 'city'])).toBe(2)
    expect(stepOfFields(['npsn', 'adminEmail'])).toBe(1)
    expect(stepOfFields(['tidak_ada'])).toBeNull()
  })
})
