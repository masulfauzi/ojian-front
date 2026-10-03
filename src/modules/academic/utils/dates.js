// Rentang tanggal tahun pelajaran Indonesia yang umum, dipakai sebagai isian awal form.

/** Nama tahun pelajaran dari tahun mulai: 2026 → "2026/2027". */
export const yearName = (startYear) => `${startYear}/${startYear + 1}`

/** Tahun mulai dari nama "2026/2027" → 2026, atau null bila format salah. */
export function startYearOf(name) {
  const match = /^(\d{4})\/(\d{4})$/.exec(name ?? '')
  return match ? Number(match[1]) : null
}

/**
 * Tanggal default: tahun 1 Juli–30 Juni; Ganjil 1 Juli–31 Desember; Genap 1 Januari–30 Juni.
 */
export function defaultYearDates(startYear) {
  const next = startYear + 1
  return {
    name: yearName(startYear),
    startDate: `${startYear}-07-01`,
    endDate: `${next}-06-30`,
    ganjilStart: `${startYear}-07-01`,
    ganjilEnd: `${startYear}-12-31`,
    genapStart: `${next}-01-01`,
    genapEnd: `${next}-06-30`,
  }
}

/** Tahun mulai yang disarankan untuk tahun pelajaran baru: setelah yang terbaru, atau tahun ini. */
export function suggestStartYear(existingNames = [], today = new Date()) {
  const years = existingNames.map(startYearOf).filter((y) => y !== null)
  if (years.length) return Math.max(...years) + 1
  // Sebelum Juli masih tahun pelajaran yang dimulai tahun lalu.
  return today.getMonth() < 6 ? today.getFullYear() - 1 : today.getFullYear()
}

/** Label semester: "2026/2027 · Ganjil". */
export const semesterLabel = (yearName, termName) => `${yearName} · ${termName}`

/**
 * Susun daftar tahun pelajaran dari daftar semester. Dipakai bila pengguna tidak punya hak
 * melihat menu tahun pelajaran (mis. guru): GET /semesters terbuka untuk semua pengguna sekolah,
 * tetapi tidak memuat nama tahun. Nama diturunkan dari tanggal mulai (Ganjil mulai Juli 2026 →
 * "2026/2027"), kecuali tahun semester aktif yang namanya diketahui dari GET /semesters/active.
 */
export function yearsFromSemesters(semesters, activeSemester = null) {
  const groups = new Map()
  for (const semester of semesters) {
    if (!groups.has(semester.academicYearId)) groups.set(semester.academicYearId, [])
    groups.get(semester.academicYearId).push(semester)
  }
  return [...groups.entries()]
    .map(([id, items]) => {
      const sorted = [...items].sort((a, b) => a.term - b.term)
      const startDate = sorted.reduce(
        (min, s) => (s.startDate < min ? s.startDate : min),
        sorted[0].startDate,
      )
      const endDate = sorted.reduce(
        (max, s) => (s.endDate > max ? s.endDate : max),
        sorted[0].endDate,
      )
      const ganjil = sorted.find((s) => s.term === 1)
      const startYear = ganjil
        ? Number(ganjil.startDate.slice(0, 4))
        : Number(sorted[0].startDate.slice(0, 4)) - 1
      const name =
        activeSemester?.academicYearId === id
          ? activeSemester.academicYearName
          : yearName(startYear)
      return {
        id,
        name,
        startDate,
        endDate,
        isActive: sorted.some((s) => s.isActive),
        semesters: sorted,
      }
    })
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
}
