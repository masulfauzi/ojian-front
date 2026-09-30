import { describe, expect, it } from 'vitest'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = {
  name: 'Budi Santoso',
  username: 'guru.budi',
  email: '',
  phone: '',
  password: 'rahasia123',
  schoolId: 's-1',
  roleIds: ['r-teacher'],
  defaultRoleId: null,
}

// Kode role per id, seperti opsi role yang dimuat form.
const CODES = {
  'r-student': 'student',
  'r-teacher': 'teacher',
  'r-admin': 'school_admin',
  'r-wk': 'wali_kelas',
}
const roleCodesOf = (ids) => ids.map((id) => CODES[id])

describe('createUserSchema', () => {
  const schema = createUserSchema()

  it('menerima data valid; email dan telepon kosong menjadi null', () => {
    const result = schema.parse(valid)
    expect(result.email).toBeNull()
    expect(result.phone).toBeNull()
  })

  it('email diisi dinormalisasi huruf kecil dan divalidasi', () => {
    expect(schema.parse({ ...valid, email: ' Budi@Example.COM ' }).email).toBe('budi@example.com')
    expect(errorsOf(schema, { ...valid, email: 'budi@' }).email).toEqual([
      'format email tidak valid',
    ])
  })

  it('username 3–50 karakter, hanya huruf, angka, titik, garis bawah, dan tanda hubung', () => {
    expect(schema.safeParse({ ...valid, username: 'budi.s_01-x' }).success).toBe(true)
    expect(errorsOf(schema, { ...valid, username: 'ab' }).username[0]).toBe('minimal 3 karakter')
    expect(errorsOf(schema, { ...valid, username: 'budi santoso' }).username[0]).toMatch(
      /hanya huruf/,
    )
  })

  it('password 8 sampai 72 karakter', () => {
    expect(schema.safeParse({ ...valid, password: 'a'.repeat(72) }).success).toBe(true)
    expect(errorsOf(schema, { ...valid, password: 'a'.repeat(73) }).password).toEqual([
      'maksimal 72 karakter',
    ])
    expect(errorsOf(schema, { ...valid, password: '1234567' }).password).toEqual([
      'minimal 8 karakter',
    ])
  })

  it('minimal satu role; role default harus salah satu role yang dipilih', () => {
    expect(errorsOf(schema, { ...valid, roleIds: [] }).roleIds).toEqual(['pilih minimal satu role'])
    expect(schema.safeParse({ ...valid, roleIds: ['a', 'b'], defaultRoleId: 'b' }).success).toBe(
      true,
    )
    expect(
      errorsOf(schema, { ...valid, roleIds: ['a'], defaultRoleId: 'z' }).defaultRoleId,
    ).toEqual(['harus salah satu role yang dipilih'])
  })

  it('sekolah kosong (pengguna platform) menjadi null', () => {
    expect(schema.parse({ ...valid, schoolId: '' }).schoolId).toBeNull()
  })
})

describe('aturan identitas login (dengan roleCodesOf)', () => {
  const schema = createUserSchema({ roleCodesOf })

  it('siswa wajib memakai NISN 10 digit sebagai username', () => {
    expect(
      errorsOf(schema, { ...valid, roleIds: ['r-student'], username: 'budi' }).username,
    ).toEqual(['siswa wajib memakai NISN 10 digit'])
    expect(
      schema.safeParse({ ...valid, roleIds: ['r-student'], username: '0012345678' }).success,
    ).toBe(true)
  })

  it('admin sekolah wajib punya email', () => {
    expect(errorsOf(schema, { ...valid, roleIds: ['r-admin'] }).email).toEqual([
      'wajib diisi untuk admin (admin login dengan email)',
    ])
    expect(
      schema.safeParse({ ...valid, roleIds: ['r-admin'], email: 'admin@sekolah.sch.id' }).success,
    ).toBe(true)
  })

  it('guru dan role kustom tidak terkena aturan', () => {
    expect(schema.safeParse({ ...valid, roleIds: ['r-teacher', 'r-wk'] }).success).toBe(true)
  })

  it('berlaku juga saat mengubah pengguna', () => {
    const { password: _password, ...rest } = valid
    const update = updateUserSchema({ roleCodesOf })
    expect(errorsOf(update, { ...rest, isActive: true, roleIds: ['r-student'] }).username).toEqual([
      'siswa wajib memakai NISN 10 digit',
    ])
  })
})

describe('updateUserSchema', () => {
  const { password: _password, ...rest } = valid
  const update = { ...rest, isActive: true }

  it('menerima data valid tanpa password', () => {
    expect(updateUserSchema().safeParse(update).success).toBe(true)
  })

  it('status aktif wajib boolean', () => {
    expect(errorsOf(updateUserSchema(), { ...update, isActive: undefined }).isActive).toEqual([
      'wajib diisi',
    ])
  })
})
