// Fungsi murni untuk rekap presensi.

const KEYS = ['total', 'present', 'late', 'excused', 'sick', 'absent', 'notYet']

/** Jumlahkan ringkasan per kelas menjadi satu total sekolah. */
export const summaryTotals = (classes) =>
  Object.fromEntries(KEYS.map((key) => [key, classes.reduce((sum, c) => sum + (c[key] ?? 0), 0)]))

export const CLASS_REPORT_COLUMNS = [
  { key: 'nis', label: 'NIS' },
  { key: 'name', label: 'Nama' },
  { key: 'schoolDays', label: 'Hari sekolah' },
  { key: 'present', label: 'Hadir' },
  { key: 'late', label: 'Terlambat' },
  { key: 'excused', label: 'Izin' },
  { key: 'sick', label: 'Sakit' },
  { key: 'absent', label: 'Alpa' },
  { key: 'attendancePercent', label: 'Kehadiran (%)' },
]

export const classReportRows = (students) =>
  students.map((s) => ({
    ...Object.fromEntries(CLASS_REPORT_COLUMNS.map(({ key }) => [key, s[key] ?? ''])),
  }))
