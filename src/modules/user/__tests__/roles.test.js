import { describe, expect, it } from 'vitest'
import { assignableRoles, keepAvailable, loginIdentityIssues } from '../utils/roles'

const roles = [
  { id: 'sa', code: 'super_admin', schoolId: null },
  { id: 'ad', code: 'school_admin', schoolId: null },
  { id: 'st', code: 'student', schoolId: null },
  { id: 'wk1', code: 'wali_kelas', schoolId: 's1' },
  { id: 'wk2', code: 'wali_kelas', schoolId: 's2' },
]

describe('assignableRoles', () => {
  it('pengguna platform (tanpa sekolah) hanya boleh super_admin', () => {
    expect(assignableRoles(roles, null).map((r) => r.id)).toEqual(['sa'])
  })

  it('user sekolah: role sistem selain super_admin + role kustom sekolahnya', () => {
    expect(assignableRoles(roles, 's1').map((r) => r.id)).toEqual(['ad', 'st', 'wk1'])
  })
})

describe('keepAvailable', () => {
  it('membuang role yang tidak tersedia', () => {
    expect(keepAvailable(['sa', 'st', 'wk2'], assignableRoles(roles, 's1'))).toEqual(['st'])
    expect(keepAvailable(undefined, roles)).toEqual([])
  })
})

describe('loginIdentityIssues', () => {
  it('siswa: username harus NISN 10 digit', () => {
    expect(loginIdentityIssues({ roleCodes: ['student'], username: '0012345678' })).toEqual({})
    expect(loginIdentityIssues({ roleCodes: ['student'], username: '12345' })).toEqual({
      username: 'siswa wajib memakai NISN 10 digit',
    })
    expect(
      loginIdentityIssues({ roleCodes: ['student'], username: 'budi123456' }).username,
    ).toBeTruthy()
  })

  it('admin (super_admin, school_admin): email wajib', () => {
    for (const code of ['super_admin', 'school_admin']) {
      expect(loginIdentityIssues({ roleCodes: [code], username: 'admin', email: null })).toEqual({
        email: 'wajib diisi untuk admin (admin login dengan email)',
      })
      expect(
        loginIdentityIssues({ roleCodes: [code], username: 'admin', email: 'a@b.co' }),
      ).toEqual({})
    }
  })

  it('siswa sekaligus admin: kedua aturan berlaku', () => {
    expect(
      Object.keys(loginIdentityIssues({ roleCodes: ['student', 'school_admin'], username: 'x' })),
    ).toEqual(['username', 'email'])
  })

  it('guru dan role kustom tidak terkena aturan', () => {
    expect(
      loginIdentityIssues({ roleCodes: ['teacher', 'wali_kelas'], username: 'guru', email: null }),
    ).toEqual({})
  })
})
