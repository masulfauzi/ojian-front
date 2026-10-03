export const STUDENT_STATUSES = [
  { value: 'active', label: 'Aktif', severity: 'success' },
  { value: 'graduated', label: 'Lulus', severity: 'info' },
  { value: 'transferred', label: 'Pindah', severity: 'warn' },
  { value: 'dropped_out', label: 'Keluar', severity: 'danger' },
]

export const STUDENT_STATUS_VALUES = STUDENT_STATUSES.map((s) => s.value)

export const statusOf = (value) =>
  STUDENT_STATUSES.find((s) => s.value === value) ?? { value, label: value, severity: 'secondary' }

export const GENDER_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

/** Batas file impor dari backend. */
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024
