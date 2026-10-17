import { describe, expect, it } from 'vitest'
import { addDays, monthKey, monthLabel, shiftMonth } from '../date'
import { distanceMeters, formatDistance, isValidCoordinate } from '../geo'

describe('geo', () => {
  it('jarak haversine sama dengan backend', () => {
    // Contoh dari backend: 14444 m.
    const d = distanceMeters(
      { latitude: -6.2, longitude: 106.8166 },
      { latitude: -6.3, longitude: 106.9 },
    )
    expect(Math.round(d)).toBe(14444)
    expect(distanceMeters(null, { latitude: 0, longitude: 0 })).toBeNull()
    expect(formatDistance(850.4)).toBe('850 m')
    expect(formatDistance(14444)).toBe('14,4 km')
    expect(isValidCoordinate(-6.2, 106.8)).toBe(true)
    expect(isValidCoordinate(95, 0)).toBe(false)
  })
})

describe('bulan', () => {
  it('kunci, geser, label', () => {
    expect(monthKey(new Date(2026, 9, 17))).toBe('2026-10')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(monthLabel('2026-10')).toBe('Oktober 2026')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})
