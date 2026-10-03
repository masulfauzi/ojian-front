import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatZoned,
  formatZonedRange,
  fromZonedInput,
  parseWallClockText,
  offsetMinutes,
  toZonedISO,
  toZonedInput,
} from '../zonedTime'

const INSTANT = '2026-10-03T00:30:00Z'

describe('zonedTime', () => {
  it('offset WIB/WITA/WIT', () => {
    const ms = Date.parse(INSTANT)
    expect(offsetMinutes(ms, 'Asia/Jakarta')).toBe(420)
    expect(offsetMinutes(ms, 'Asia/Makassar')).toBe(480)
    expect(offsetMinutes(ms, 'Asia/Jayapura')).toBe(540)
  })

  it('toZonedInput memberi jam dinding sekolah, bukan jam perangkat', () => {
    const wib = toZonedInput(INSTANT, 'Asia/Jakarta')
    expect([wib.getDate(), wib.getHours(), wib.getMinutes()]).toEqual([3, 7, 30])
    const wit = toZonedInput(INSTANT, 'Asia/Jayapura')
    expect([wit.getDate(), wit.getHours()]).toEqual([3, 9])
    expect(toZonedInput(null)).toBeNull()
  })

  it('fromZonedInput menghasilkan RFC 3339 dengan offset sekolah', () => {
    const local = new Date(2026, 9, 3, 7, 30)
    expect(fromZonedInput(local, 'Asia/Jakarta')).toBe('2026-10-03T07:30:00+07:00')
    expect(fromZonedInput(local, 'Asia/Makassar')).toBe('2026-10-03T07:30:00+08:00')
    expect(fromZonedInput(local, 'Asia/Jayapura')).toBe('2026-10-03T07:30:00+09:00')
    expect(fromZonedInput(null)).toBeNull()
  })

  it('pulang-pergi mempertahankan instan', () => {
    for (const tz of ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']) {
      expect(Date.parse(toZonedISO(INSTANT, tz))).toBe(Date.parse(INSTANT))
    }
    expect(toZonedISO('2026-10-03T21:44:18.633+07:00', 'Asia/Jakarta')).toBe(
      '2026-10-03T21:44:00+07:00',
    )
  })

  it('format menurut zona sekolah', () => {
    expect(formatZoned(INSTANT, 'Asia/Jakarta')).toMatch(/3 Okt 2026.*07[.:]30 WIB$/)
    expect(formatZoned(INSTANT, 'Asia/Jayapura', { withDate: false })).toMatch(/^09[.:]30 WIT$/)
    expect(formatZoned(null)).toBe('-')
    expect(formatZonedRange(INSTANT, '2026-10-03T02:00:00Z', 'Asia/Jakarta')).toMatch(
      /3 Okt 2026.*07[.:]30–09[.:]00 WIB$/,
    )
    expect(formatDuration(3909)).toBe('1:05:09')
    expect(formatDuration(65)).toBe('01:05')
    expect(formatDuration(-3)).toBe('00:00')
  })
  it('parse ketikan dd/mm/yyyy hh:mm', () => {
    const d = parseWallClockText('04/10/2026 03:56')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 9, 4, 3, 56,
    ])
    expect(fromZonedInput(parseWallClockText('5/1/2027 7.05'), 'Asia/Makassar')).toBe(
      '2027-01-05T07:05:00+08:00',
    )
    expect(parseWallClockText('31/02/2026 10:00')).toBeNull()
    expect(parseWallClockText('04/10/2026 24:00')).toBeNull()
    expect(parseWallClockText('04/10/2026')).toBeNull()
  })
})
