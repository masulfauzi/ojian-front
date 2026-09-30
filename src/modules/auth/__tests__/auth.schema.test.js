import { describe, expect, it } from 'vitest'
import { changePasswordSchema, loginSchema } from '../schemas/auth.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('loginSchema', () => {
  it('menerima email tanpa kode sekolah', () => {
    const result = loginSchema.parse({ login: ' admin@example.com ', password: 'rahasia123' })
    expect(result).toEqual({ login: 'admin@example.com', password: 'rahasia123', schoolCode: '' })
  })

  it('menerima username + kode sekolah dan menormalisasi kode', () => {
    const result = loginSchema.parse({ login: '2024001', password: 'x', schoolCode: ' SMAN1-JKT ' })
    expect(result.schoolCode).toBe('sman1-jkt')
  })

  it('login dan password wajib diisi', () => {
    const errors = errorsOf(loginSchema, { login: '', password: '' })
    expect(errors.login).toEqual(['wajib diisi'])
    expect(errors.password).toEqual(['wajib diisi'])
  })

  it('password maksimal 72 karakter, kode sekolah maksimal 30', () => {
    const errors = errorsOf(loginSchema, {
      login: 'budi',
      password: 'a'.repeat(73),
      schoolCode: 'a'.repeat(31),
    })
    expect(errors.password).toEqual(['maksimal 72 karakter'])
    expect(errors.schoolCode).toEqual(['maksimal 30 karakter'])
  })
})

describe('changePasswordSchema', () => {
  const valid = { oldPassword: 'lama12345', newPassword: 'baru12345', confirmPassword: 'baru12345' }

  it('menerima data valid', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('batas 8–72 karakter', () => {
    const p72 = 'a'.repeat(72)
    const p73 = 'a'.repeat(73)
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: p72, confirmPassword: p72 }).success,
    ).toBe(true)
    expect(
      errorsOf(changePasswordSchema, { ...valid, newPassword: p73, confirmPassword: p73 })
        .newPassword,
    ).toEqual(['maksimal 72 karakter'])
    expect(
      errorsOf(changePasswordSchema, { ...valid, newPassword: 'pendek', confirmPassword: 'pendek' })
        .newPassword,
    ).toEqual(['minimal 8 karakter'])
  })

  it('konfirmasi harus sama dan password baru berbeda dari lama', () => {
    expect(
      errorsOf(changePasswordSchema, { ...valid, confirmPassword: 'lain12345' }).confirmPassword,
    ).toEqual(['konfirmasi password tidak cocok'])
    expect(
      errorsOf(changePasswordSchema, {
        oldPassword: 'sama12345',
        newPassword: 'sama12345',
        confirmPassword: 'sama12345',
      }).newPassword,
    ).toEqual(['tidak boleh sama dengan password lama'])
  })
})
