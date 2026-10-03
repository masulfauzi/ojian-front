// Pilihan dan label jadwal ujian (nilai sama dengan enum backend).

export const CATEGORY_OPTIONS = [
  { value: 'daily', label: 'Ulangan harian' },
  { value: 'midterm', label: 'Penilaian tengah semester' },
  { value: 'final', label: 'Penilaian akhir semester' },
  { value: 'school_exam', label: 'Ujian sekolah' },
  { value: 'remedial', label: 'Remedial' },
  { value: 'practice', label: 'Latihan' },
  { value: 'other', label: 'Lainnya' },
]

export const SCHEDULE_STATUSES = [
  { value: 'draft', label: 'Draf', severity: 'secondary' },
  { value: 'published', label: 'Dipublikasikan', severity: 'success' },
  { value: 'cancelled', label: 'Dibatalkan', severity: 'danger' },
]

/** Keadaan waktu diturunkan server dari starts_at/ends_at. */
export const TIME_STATES = {
  upcoming: { label: 'Akan datang', severity: 'info', icon: 'pi pi-clock' },
  open: { label: 'Berlangsung', severity: 'success', icon: 'pi pi-play' },
  finished: { label: 'Selesai', severity: 'secondary', icon: 'pi pi-check' },
}

export const SCORE_POLICY_OPTIONS = [
  { value: 'best', label: 'Nilai terbaik' },
  { value: 'latest', label: 'Pengerjaan terakhir' },
  { value: 'first', label: 'Pengerjaan pertama' },
]

export const RESULT_VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Disembunyikan' },
  { value: 'after_submit', label: 'Setelah siswa mengumpulkan' },
  { value: 'after_end', label: 'Setelah jadwal berakhir' },
  { value: 'manual', label: 'Saat guru mempublikasikan' },
]

export const REVIEW_VISIBILITY_OPTIONS = [
  { value: 'hidden', label: 'Disembunyikan' },
  { value: 'after_end', label: 'Setelah jadwal berakhir' },
  { value: 'manual', label: 'Saat guru mempublikasikan hasil' },
]

export const PARTICIPANT_STATUSES = [
  { value: 'eligible', label: 'Peserta' },
  { value: 'excluded', label: 'Dikecualikan' },
]

const find = (list, value) => list.find((o) => o.value === value)

export const categoryLabel = (value) => find(CATEGORY_OPTIONS, value)?.label ?? value
export const scheduleStatusOf = (value) =>
  find(SCHEDULE_STATUSES, value) ?? { value, label: value, severity: 'secondary' }
export const timeStateOf = (value) => TIME_STATES[value] ?? { label: value, severity: 'secondary' }
export const labelOf = (list, value) => find(list, value)?.label ?? value ?? '-'
