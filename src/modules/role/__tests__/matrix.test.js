import { describe, expect, it } from 'vitest'
import {
  groupRows,
  isColumnFull,
  isMatrixDirty,
  isRowFull,
  setColumn,
  setPermission,
  setRow,
} from '../utils/matrix'

const empty = {
  menuId: 'm1',
  code: 'users',
  view: false,
  create: false,
  update: false,
  delete: false,
}

describe('aturan matriks hak akses', () => {
  it('mencentang tambah/ubah/hapus ikut mencentang lihat', () => {
    expect(setPermission(empty, 'delete', true)).toMatchObject({ view: true, delete: true })
  })

  it('mencabut lihat mencabut semua hak', () => {
    const full = { ...empty, view: true, create: true, update: true, delete: true }
    expect(setPermission(full, 'view', false)).toMatchObject({
      view: false,
      create: false,
      update: false,
      delete: false,
    })
  })

  it('mencabut satu hak selain lihat tidak mengubah hak lain', () => {
    const full = { ...empty, view: true, create: true, update: true, delete: true }
    expect(setPermission(full, 'create', false)).toMatchObject({
      view: true,
      create: false,
      update: true,
    })
  })

  it('setRow hanya menyentuh hak yang diizinkan', () => {
    const onlyView = (_row, action) => action === 'view'
    expect(setRow(empty, true, onlyView)).toMatchObject({ view: true, create: false })
    expect(isRowFull(setRow(empty, true))).toBe(true)
    expect(isRowFull(setRow({ ...empty, view: true, create: true }, false))).toBe(false)
    expect(setRow({ ...empty, view: true, create: true }, false)).toMatchObject({
      view: false,
      create: false,
    })
  })

  it('setColumn dan isColumnFull', () => {
    const rows = [empty, { ...empty, menuId: 'm2', code: 'roles' }]
    const next = setColumn(rows, 'update', true, (row) => row.code === 'users')
    expect(next[0]).toMatchObject({ view: true, update: true })
    expect(next[1]).toMatchObject({ view: false, update: false })
    expect(isColumnFull(next, 'update')).toBe(false)
    expect(isColumnFull(setColumn(rows, 'update', true), 'update')).toBe(true)
  })

  it('isMatrixDirty membandingkan dengan kondisi awal', () => {
    expect(isMatrixDirty([empty], [empty])).toBe(false)
    expect(isMatrixDirty([setPermission(empty, 'view', true)], [empty])).toBe(true)
  })

  it('groupRows mengelompokkan per induk dan mengurutkan', () => {
    const rows = [
      { menuId: 'a', parentId: 'g', sortOrder: 20 },
      { menuId: 'b', parentId: null, sortOrder: 10 },
      { menuId: 'c', parentId: 'g', sortOrder: 10 },
    ]
    const groups = groupRows(rows, (id) => (id ? 'Manajemen' : 'Umum'))
    expect(groups.map((g) => g.name)).toEqual(['Manajemen', 'Umum'])
    expect(groups[0].rows.map((r) => r.menuId)).toEqual(['c', 'a'])
  })
})
