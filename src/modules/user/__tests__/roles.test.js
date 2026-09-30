import { describe, expect, it } from 'vitest'
import { assignableRoles, keepAvailable } from '../utils/roles'

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
