import { describe, expect, it } from 'vitest'
import { changePasswordSchema, loginSchema } from '../schemas/auth.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('loginSchema', () => {
  it('menerima kredensial valid dan menormalisasi email', () => {
    const result = loginSchema.parse({ email: '  Admin@Example.COM ', password: 'rahasia123' })
    expect(result.email).toBe('admin@example.com')
  })

  it('menolak field kosong dengan pesan Indonesia', () => {
    const errors = errorsOf(loginSchema, { email: '', password: '' })
    expect(errors.email).toContain('wajib diisi')
    expect(errors.password).toContain('wajib diisi')
  })

  it('menolak field yang tidak dikirim (undefined)', () => {
    const errors = errorsOf(loginSchema, {})
    expect(errors.email).toEqual(['wajib diisi'])
  })

  it('menolak format email tidak valid', () => {
    expect(errorsOf(loginSchema, { email: 'bukan-email', password: 'x' }).email).toEqual([
      'format email tidak valid',
    ])
  })

  it('menolak password lebih dari 72 karakter', () => {
    const errors = errorsOf(loginSchema, { email: 'a@b.co', password: 'a'.repeat(73) })
    expect(errors.password).toEqual(['maksimal 72 karakter'])
  })
})

describe('changePasswordSchema', () => {
  const valid = { oldPassword: 'lama12345', newPassword: 'baru12345', confirmPassword: 'baru12345' }

  it('menerima data valid', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('password baru minimal 8 karakter', () => {
    const errors = errorsOf(changePasswordSchema, {
      ...valid,
      newPassword: 'pendek',
      confirmPassword: 'pendek',
    })
    expect(errors.newPassword).toEqual(['minimal 8 karakter'])
  })

  it('batas 72 karakter: 72 diterima, 73 ditolak', () => {
    const p72 = 'a'.repeat(72)
    const p73 = 'a'.repeat(73)
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: p72, confirmPassword: p72 }).success,
    ).toBe(true)
    expect(
      errorsOf(changePasswordSchema, { ...valid, newPassword: p73, confirmPassword: p73 })
        .newPassword,
    ).toEqual(['maksimal 72 karakter'])
  })

  it('konfirmasi harus sama dengan password baru', () => {
    const errors = errorsOf(changePasswordSchema, { ...valid, confirmPassword: 'berbeda123' })
    expect(errors.confirmPassword).toEqual(['konfirmasi password tidak cocok'])
  })

  it('password baru tidak boleh sama dengan password lama', () => {
    const errors = errorsOf(changePasswordSchema, {
      oldPassword: 'sama12345',
      newPassword: 'sama12345',
      confirmPassword: 'sama12345',
    })
    expect(errors.newPassword).toEqual(['tidak boleh sama dengan password lama'])
  })
})
