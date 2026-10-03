import { describe, expect, it } from 'vitest'
import { fromISODate, isISODate, toISODate } from '../date'
import { toCsv } from '../download'
import { formatDate } from '../format'

describe('date utils', () => {
  it('toISODate memakai tanggal lokal', () => {
    expect(toISODate(new Date(2026, 6, 13, 23, 59))).toBe('2026-07-13')
    expect(toISODate(null)).toBeNull()
    expect(toISODate(new Date('x'))).toBeNull()
  })

  it('fromISODate menghasilkan tanggal lokal dan menolak tanggal mustahil', () => {
    const date = fromISODate('2026-07-13')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 6, 13, 0,
    ])
    expect(fromISODate('2026-02-30')).toBeNull()
    expect(fromISODate('13/07/2026')).toBeNull()
    expect(isISODate('2026-12-31')).toBe(true)
  })

  it('formatDate untuk tanggal saja tidak bergeser hari', () => {
    expect(formatDate('2026-07-01')).toBe('1 Juli 2026')
  })
})

describe('toCsv', () => {
  it('menambah BOM, header, dan meng-escape koma/kutip/baris baru', () => {
    const csv = toCsv(
      [
        { name: 'Siti, Aminah', pw: 'a"b' },
        { name: 'Budi', pw: null },
      ],
      [
        { key: 'name', label: 'Nama' },
        { key: 'pw', label: 'Password' },
      ],
    )
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Nama,Password',
      '"Siti, Aminah","a""b"',
      'Budi,',
      '',
    ])
  })
})
