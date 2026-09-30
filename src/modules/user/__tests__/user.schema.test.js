import { describe, expect, it } from 'vitest'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('createUserSchema', () => {
  const valid = {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    password: 'rahasia123',
    role: 'student',
  }

  it('menerima data valid dan menormalisasi email', () => {
    const result = createUserSchema.parse({ ...valid, email: ' Budi@Example.com ' })
    expect(result.email).toBe('budi@example.com')
  })

  it('nama minimal 2 karakter', () => {
    expect(errorsOf(createUserSchema, { ...valid, name: 'B' }).name).toEqual(['minimal 2 karakter'])
  })

  it('email wajib dan harus valid', () => {
    expect(errorsOf(createUserSchema, { ...valid, email: '' }).email).toContain('wajib diisi')
    expect(errorsOf(createUserSchema, { ...valid, email: 'budi@' }).email).toEqual([
      'format email tidak valid',
    ])
  })

  it('password 8 sampai 72 karakter', () => {
    expect(errorsOf(createUserSchema, { ...valid, password: '1234567' }).password).toEqual([
      'minimal 8 karakter',
    ])
    expect(createUserSchema.safeParse({ ...valid, password: 'a'.repeat(72) }).success).toBe(true)
    expect(errorsOf(createUserSchema, { ...valid, password: 'a'.repeat(73) }).password).toEqual([
      'maksimal 72 karakter',
    ])
  })

  it('role harus salah satu role yang dikenal', () => {
    expect(errorsOf(createUserSchema, { ...valid, role: 'kepala' }).role[0]).toMatch(
      /harus salah satu dari/,
    )
    expect(errorsOf(createUserSchema, { ...valid, role: null }).role).toEqual(['wajib diisi'])
  })
})

describe('updateUserSchema', () => {
  const valid = { name: 'Budi', email: 'budi@example.com', role: 'teacher', isActive: false }

  it('menerima data valid tanpa password', () => {
    expect(updateUserSchema.safeParse(valid).success).toBe(true)
  })

  it('status aktif wajib boolean', () => {
    expect(errorsOf(updateUserSchema, { ...valid, isActive: undefined }).isActive).toEqual([
      'wajib diisi',
    ])
  })

  it('mengabaikan field password', () => {
    const result = updateUserSchema.parse({ ...valid, password: 'x' })
    expect(result).not.toHaveProperty('password')
  })
})
