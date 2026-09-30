import { describe, expect, it } from 'vitest'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = {
  name: 'Budi Santoso',
  username: '2024001',
  email: '',
  phone: '',
  password: 'rahasia123',
  schoolId: 's-1',
  roleIds: ['r-student'],
  defaultRoleId: null,
}

describe('createUserSchema', () => {
  it('menerima data valid; email dan telepon kosong menjadi null', () => {
    const result = createUserSchema.parse(valid)
    expect(result.email).toBeNull()
    expect(result.phone).toBeNull()
  })

  it('email diisi dinormalisasi huruf kecil dan divalidasi', () => {
    expect(createUserSchema.parse({ ...valid, email: ' Budi@Example.COM ' }).email).toBe(
      'budi@example.com',
    )
    expect(errorsOf(createUserSchema, { ...valid, email: 'budi@' }).email).toEqual([
      'format email tidak valid',
    ])
  })

  it('username 3–50 karakter, hanya huruf, angka, titik, garis bawah, dan tanda hubung', () => {
    expect(createUserSchema.safeParse({ ...valid, username: 'budi.s_01-x' }).success).toBe(true)
    expect(errorsOf(createUserSchema, { ...valid, username: 'ab' }).username[0]).toBe(
      'minimal 3 karakter',
    )
    expect(errorsOf(createUserSchema, { ...valid, username: 'budi santoso' }).username[0]).toMatch(
      /hanya huruf/,
    )
  })

  it('password 8 sampai 72 karakter', () => {
    expect(createUserSchema.safeParse({ ...valid, password: 'a'.repeat(72) }).success).toBe(true)
    expect(errorsOf(createUserSchema, { ...valid, password: 'a'.repeat(73) }).password).toEqual([
      'maksimal 72 karakter',
    ])
    expect(errorsOf(createUserSchema, { ...valid, password: '1234567' }).password).toEqual([
      'minimal 8 karakter',
    ])
  })

  it('minimal satu role', () => {
    expect(errorsOf(createUserSchema, { ...valid, roleIds: [] }).roleIds).toEqual([
      'pilih minimal satu role',
    ])
  })

  it('role default harus salah satu role yang dipilih', () => {
    expect(
      createUserSchema.safeParse({ ...valid, roleIds: ['a', 'b'], defaultRoleId: 'b' }).success,
    ).toBe(true)
    expect(
      errorsOf(createUserSchema, { ...valid, roleIds: ['a'], defaultRoleId: 'z' }).defaultRoleId,
    ).toEqual(['harus salah satu role yang dipilih'])
  })

  it('sekolah kosong (pengguna platform) menjadi null', () => {
    expect(createUserSchema.parse({ ...valid, schoolId: '' }).schoolId).toBeNull()
  })
})

describe('updateUserSchema', () => {
  const { password: _password, ...rest } = valid
  const update = { ...rest, isActive: true }

  it('menerima data valid tanpa password', () => {
    expect(updateUserSchema.safeParse(update).success).toBe(true)
  })

  it('status aktif wajib boolean', () => {
    expect(errorsOf(updateUserSchema, { ...update, isActive: undefined }).isActive).toEqual([
      'wajib diisi',
    ])
  })
})
