// Fungsi murni untuk penilaian manual.

/** Rubrik uraian dari answer_key: [{ id, criterion, maxPoints }]. */
export const rubricOf = (type, answerKey) =>
  type === 'essay'
    ? (answerKey?.rubric ?? []).map((r) => ({
        id: r.id,
        criterion: r.criterion ?? '',
        maxPoints: Number(r.max_points ?? 0),
      }))
    : []

/** Total nilai kriteria (dibulatkan 2 desimal). */
export const criteriaTotal = (criteria) =>
  Math.round(Object.values(criteria).reduce((sum, v) => sum + Number(v || 0), 0) * 100) / 100

/** Kriteria lengkap & dalam batas? */
export const criteriaValid = (rubric, criteria) =>
  rubric.every((r) => {
    const v = criteria[r.id]
    return typeof v === 'number' && v >= 0 && v <= r.maxPoints
  })

/** Baris rekap → CSV. */
export const resultRows = (items, statusLabel = (status) => status) =>
  items.map((item) => ({
    nis: item.nis ?? '',
    name: item.name,
    className: item.className ?? '',
    attemptNo: item.attemptNo ?? '',
    score: item.totalScore ?? '',
    maxScore: item.maxScore ?? '',
    percent: item.scorePercent === null ? '' : item.scorePercent,
    passed: item.passed === null ? '' : item.passed ? 'Lulus' : 'Belum lulus',
    status: item.attemptId ? statusLabel(item.gradingStatus) : 'Belum mengerjakan',
  }))

export const RESULT_COLUMNS = [
  { key: 'nis', label: 'NIS' },
  { key: 'name', label: 'Nama' },
  { key: 'className', label: 'Kelas' },
  { key: 'attemptNo', label: 'Pengerjaan ke' },
  { key: 'score', label: 'Skor' },
  { key: 'maxScore', label: 'Skor maks' },
  { key: 'percent', label: 'Nilai (%)' },
  { key: 'passed', label: 'Kelulusan' },
  { key: 'status', label: 'Status penilaian' },
]

/** Kategori indeks kesukaran (p): < 0,3 sukar, 0,3–0,7 sedang, > 0,7 mudah. */
export function difficultyLabel(index) {
  if (index === null || index === undefined) return { label: '-', severity: 'secondary' }
  if (index < 0.3) return { label: 'Sukar', severity: 'danger' }
  if (index <= 0.7) return { label: 'Sedang', severity: 'warn' }
  return { label: 'Mudah', severity: 'success' }
}
