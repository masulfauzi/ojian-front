import { describe, expect, it } from 'vitest'
import { FAQ } from '../data/faq'
import { NAV_LINKS } from '../data/navigation'
import { PILLARS } from '../data/pillars'
import { QUESTION_TYPES } from '../data/questionTypes'
import { ROLES } from '../data/roles'
import { TRUST_POINTS } from '../data/trust'
import { WORKFLOWS } from '../data/workflows'

// Semua rute aplikasi dari routes.js modul (penjaga klaim fitur `available`).
const moduleRoutes = Object.values(
  import.meta.glob('@/modules/*/routes.js', { eager: true, import: 'default' }),
).flat()
const routePaths = new Set(moduleRoutes.map((r) => r.path))

const features = PILLARS.flatMap((p) => p.features)
const STATUSES = ['available', 'coming_soon']

/** Semua string di struktur data (untuk memeriksa HTML). */
const strings = (value) =>
  typeof value === 'string'
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === 'object'
        ? Object.values(value).flatMap(strings)
        : []

describe('data landing', () => {
  it('id unik di seluruh berkas data', () => {
    const ids = [
      ...PILLARS.map((p) => p.id),
      ...features.map((f) => f.id),
      ...QUESTION_TYPES.map((q) => q.id),
      ...WORKFLOWS.flatMap((w) => [w.id, ...w.steps.map((s) => s.id)]),
      ...ROLES.map((r) => r.id),
      ...TRUST_POINTS.map((t) => t.id),
      ...FAQ.map((f) => f.id),
    ]
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
  })

  it('struktur lengkap: enam pilar, fitur & jenis soal berstatus valid, 14 jenis soal', () => {
    expect(PILLARS).toHaveLength(6)
    for (const pillar of PILLARS) {
      expect(pillar.title && pillar.tagline && pillar.icon, pillar.id).toBeTruthy()
      expect(pillar.features.length, pillar.id).toBeGreaterThan(0)
    }
    for (const item of [...features, ...QUESTION_TYPES]) {
      expect(STATUSES, item.id).toContain(item.status)
      expect(item.title.trim(), item.id).not.toBe('')
      expect(item.summary.trim(), item.id).not.toBe('')
    }
    expect(QUESTION_TYPES).toHaveLength(14)
    expect(WORKFLOWS).toHaveLength(3)
    expect(ROLES.map((r) => r.title)).toEqual([
      'Siswa',
      'Guru',
      'Admin Presensi',
      'Admin Sekolah',
      'Super Admin',
    ])
    expect(FAQ.length).toBeGreaterThanOrEqual(10)
  })

  it('teks tanpa HTML', () => {
    const all = strings({ PILLARS, QUESTION_TYPES, WORKFLOWS, ROLES, TRUST_POINTS, FAQ, NAV_LINKS })
    const withHtml = all.filter((text) => /<[a-z/!]/i.test(text))
    expect(withHtml).toEqual([])
  })

  it('penjaga klaim: setiap fitur "available" dengan routePath punya rute di aplikasi', () => {
    const missing = features
      .filter((f) => f.status === 'available' && f.routePath && !routePaths.has(f.routePath))
      .map((f) => `${f.id} → ${f.routePath}`)
    expect(
      missing,
      `Fitur ditandai tersedia tetapi rutenya tidak ada: ${missing.join(', ')}`,
    ).toEqual([])
  })

  it('FAQ jenis soal menyebut jenis yang segera hadir', () => {
    const soon = QUESTION_TYPES.filter((q) => q.status === 'coming_soon')
    const answer = FAQ.find((f) => f.id === 'faq-jenis-soal').answer.toLowerCase()
    expect(answer).toContain('segera hadir')
    for (const q of soon) expect(answer).toContain(q.title.toLowerCase())
  })
})
