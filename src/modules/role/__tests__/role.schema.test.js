import { describe, expect, it } from 'vitest'
import { createRoleSchema, updateRoleSchema } from '../schemas/role.schema'

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = { code: 'wali_kelas', name: 'Wali Kelas', description: '', schoolId: 's1' }

describe('role schema', () => {
  it('menerima data valid; deskripsi kosong menjadi null', () => {
    expect(createRoleSchema().parse(valid).description).toBeNull()
  })

  it('kode diawali huruf kecil, hanya huruf kecil, angka, dan garis bawah', () => {
    expect(createRoleSchema().parse({ ...valid, code: 'Wali_Kelas' }).code).toBe('wali_kelas')
    expect(errorsOf(createRoleSchema(), { ...valid, code: '1wali' }).code[0]).toMatch(/diawali/)
    expect(errorsOf(createRoleSchema(), { ...valid, code: 'wali-kelas' }).code[0]).toMatch(
      /diawali/,
    )
  })

  it('sekolah wajib bila pembuat pengguna platform', () => {
    expect(
      errorsOf(createRoleSchema({ requireSchool: true }), { ...valid, schoolId: null }).schoolId,
    ).toEqual(['wajib diisi'])
    expect(createRoleSchema().safeParse({ ...valid, schoolId: null }).success).toBe(true)
  })

  it('update memerlukan status aktif', () => {
    expect(updateRoleSchema.safeParse({ ...valid, isActive: true }).success).toBe(true)
    expect(errorsOf(updateRoleSchema, valid).isActive).toEqual(['wajib diisi'])
  })
})
