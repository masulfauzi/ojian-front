// Label dan pilihan presensi/izin (nilai sama dengan enum backend).

/** status null = belum presensi (hari ini). */
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Hadir', short: 'H', severity: 'success' },
  { value: 'late', label: 'Terlambat', short: 'T', severity: 'warn' },
  { value: 'excused', label: 'Izin', short: 'I', severity: 'info' },
  { value: 'sick', label: 'Sakit', short: 'S', severity: 'info' },
  { value: 'absent', label: 'Alpa', short: 'A', severity: 'danger' },
]
const NOT_YET = { value: null, label: 'Belum presensi', short: '–', severity: 'secondary' }

export const attendanceStatusOf = (value) =>
  ATTENDANCE_STATUSES.find((s) => s.value === value) ?? NOT_YET

/** Filter status data harian (`none` = belum presensi). */
export const RECORD_STATUS_FILTERS = [
  ...ATTENDANCE_STATUSES.map(({ value, label }) => ({ value, label })),
  { value: 'none', label: 'Belum presensi' },
]

export const SOURCE_LABELS = {
  selfie: 'Selfie',
  admin: 'Koreksi admin',
  leave: 'Izin',
  system: 'Sistem',
}

export const LEAVE_TYPES = [
  { value: 'sick', label: 'Sakit' },
  { value: 'permission', label: 'Izin' },
]
export const leaveTypeLabel = (value) => LEAVE_TYPES.find((t) => t.value === value)?.label ?? value

export const LEAVE_STATUSES = [
  { value: 'pending', label: 'Menunggu', severity: 'warn' },
  { value: 'approved', label: 'Disetujui', severity: 'success' },
  { value: 'rejected', label: 'Ditolak', severity: 'danger' },
  { value: 'cancelled', label: 'Dibatalkan', severity: 'secondary' },
]
export const leaveStatusOf = (value) =>
  LEAVE_STATUSES.find((s) => s.value === value) ?? { value, label: value, severity: 'secondary' }

/** ISO weekday: 1 = Senin … 7 = Minggu. */
export const WEEKDAYS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 7, label: 'Minggu', short: 'Min' },
]

export const GEOFENCE_MODES = [
  { value: 'off', label: 'Nonaktif', hint: 'Lokasi tidak diminta dan tidak disimpan.' },
  {
    value: 'flag',
    label: 'Tandai',
    hint: 'Presensi di luar radius tetap diterima tetapi ditandai.',
  },
  { value: 'enforce', label: 'Wajib', hint: 'Presensi di luar radius ditolak.' },
]

/** Keadaan presensi hari ini (GET /attendance/today). */
export const TODAY_STATES = {
  not_school_day: {
    label: 'Bukan hari sekolah',
    icon: 'pi pi-calendar-times',
    severity: 'secondary',
  },
  not_open: { label: 'Belum dibuka', icon: 'pi pi-clock', severity: 'info' },
  open: { label: 'Dibuka', icon: 'pi pi-camera', severity: 'success' },
  closed: { label: 'Sudah ditutup', icon: 'pi pi-lock', severity: 'danger' },
  done: { label: 'Sudah presensi', icon: 'pi pi-check-circle', severity: 'success' },
}

/** Maksimal berkas bukti per izin. */
export const MAX_LEAVE_FILES = 3
export const LEAVE_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
