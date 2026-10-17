// Semua pemetaan kontrak endpoint /attendance ada di file ini.
// Sumber: Swagger exam-api — tag "Presensi Siswa", "Admin Presensi", "Rekap Presensi"
// (attendance.TodayResponse, CheckInResponse, MonthlyResponse, DailyItem, CorrectionRequest,
// SettingsRequest/Response, SummaryResponse, ClassReportResponse). Desain: issue-presensi.md.
// Waktu dari server sudah ber-offset zona sekolah; tanggal 'YYYY-MM-DD'; jam 'HH:MM'.
import { http, unwrap, unwrapList } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

const FIELD_MAP = {
  late_minutes: 'lateMinutes',
  opens_at: 'opensAt',
  on_time_until: 'onTimeUntil',
  closes_at: 'closesAt',
  work_days: 'workDays',
  require_selfie: 'requireSelfie',
  selfie_retention_days: 'selfieRetentionDays',
  geofence_mode: 'geofenceMode',
  geofence_radius_m: 'geofenceRadiusM',
  max_gps_accuracy_m: 'maxGpsAccuracyM',
  leave_max_days: 'leaveMaxDays',
  leave_backdate_days: 'leaveBackdateDays',
  leave_proof_required: 'leaveProofRequired',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

const scoped = (schoolId, params = {}) => (schoolId ? { ...params, school_id: schoolId } : params)

export const toRecord = (data) =>
  data
    ? {
        date: data.date,
        status: data.status ?? null,
        source: data.source ?? null,
        checkedInAt: data.checked_in_at ?? null,
        lateMinutes: data.late_minutes ?? null,
        withinGeofence: data.within_geofence ?? null,
      }
    : null

export const toToday = (data) => ({
  date: data.date,
  isSchoolDay: Boolean(data.is_school_day),
  /** not_school_day | not_open | open | closed | done */
  state: data.state,
  window: {
    opensAt: data.window?.opens_at ?? null,
    onTimeUntil: data.window?.on_time_until ?? null,
    closesAt: data.window?.closes_at ?? null,
  },
  requireSelfie: Boolean(data.require_selfie),
  geofenceMode: data.geofence_mode ?? 'off',
  serverTime: data.server_time ?? null,
  record: toRecord(data.record),
  leave: data.leave
    ? {
        id: data.leave.id,
        leaveType: data.leave.leave_type,
        startDate: data.leave.start_date,
        endDate: data.leave.end_date,
      }
    : null,
})

export const toCheckIn = (data) => ({
  date: data.date,
  status: data.status,
  lateMinutes: data.late_minutes ?? null,
  checkedInAt: data.checked_in_at ?? null,
  withinGeofence: data.within_geofence ?? null,
  alreadyCheckedIn: Boolean(data.already_checked_in),
})

const toSummary = (data = {}) => ({
  schoolDays: data.school_days ?? 0,
  present: data.present ?? 0,
  late: data.late ?? 0,
  excused: data.excused ?? 0,
  sick: data.sick ?? 0,
  absent: data.absent ?? 0,
  attendancePercent: data.attendance_percent ?? null,
})

export const toMonthly = (data) => ({
  month: data.month,
  student: data.student
    ? {
        id: data.student.id,
        name: data.student.name,
        nis: data.student.nis ?? null,
        className: data.student.class_name ?? null,
      }
    : null,
  summary: toSummary(data.summary),
  days: (data.days ?? []).map((d) => ({
    date: d.date,
    status: d.status ?? null,
    source: d.source ?? null,
    checkedInAt: d.checked_in_at ?? null,
    lateMinutes: d.late_minutes ?? null,
  })),
})

export const toDailyItem = (data) => ({
  studentId: data.student_id,
  name: data.name,
  nis: data.nis ?? null,
  classId: data.class_id ?? null,
  className: data.class_name ?? null,
  status: data.status ?? null,
  source: data.source ?? null,
  checkedInAt: data.checked_in_at ?? null,
  lateMinutes: data.late_minutes ?? null,
  withinGeofence: data.within_geofence ?? null,
  hasSelfie: Boolean(data.has_selfie),
})

export const toSettings = (data) => ({
  schoolId: data.school_id ?? null,
  timezone: data.timezone ?? null,
  workDays: data.work_days ?? [],
  opensAt: data.opens_at,
  onTimeUntil: data.on_time_until,
  closesAt: data.closes_at,
  requireSelfie: Boolean(data.require_selfie),
  geofenceMode: data.geofence_mode ?? 'off',
  latitude: data.latitude ?? null,
  longitude: data.longitude ?? null,
  geofenceRadiusM: data.geofence_radius_m ?? null,
  maxGpsAccuracyM: data.max_gps_accuracy_m ?? 100,
  selfieRetentionDays: data.selfie_retention_days ?? 30,
  leaveProofRequired: Boolean(data.leave_proof_required),
  leaveMaxDays: data.leave_max_days ?? 14,
  leaveBackdateDays: data.leave_backdate_days ?? 3,
  updatedAt: data.updated_at ?? null,
})

/** Body SettingsRequest. Geofence nonaktif: koordinat dan radius tidak dikirim. */
export function toSettingsBody(values) {
  const body = {
    opens_at: values.opensAt,
    on_time_until: values.onTimeUntil,
    closes_at: values.closesAt,
    work_days: [...values.workDays].sort((a, b) => a - b),
    require_selfie: values.requireSelfie,
    selfie_retention_days: values.selfieRetentionDays,
    geofence_mode: values.geofenceMode,
    max_gps_accuracy_m: values.maxGpsAccuracyM,
    leave_proof_required: values.leaveProofRequired,
    leave_max_days: values.leaveMaxDays,
    leave_backdate_days: values.leaveBackdateDays,
  }
  if (values.geofenceMode !== 'off') {
    body.latitude = values.latitude
    body.longitude = values.longitude
    body.geofence_radius_m = values.geofenceRadiusM
  }
  return body
}

// ---- Siswa ----

export async function getToday() {
  const res = await http.get('/attendance/today')
  return toToday(unwrap(res))
}

/** Multipart: `selfie` (Blob JPEG) dan lokasi (bila geofence aktif). */
export async function checkIn({ selfie, location } = {}) {
  const form = new FormData()
  if (selfie) form.append('selfie', selfie, selfie.name || 'selfie.jpg')
  if (location) {
    form.append('latitude', String(location.latitude))
    form.append('longitude', String(location.longitude))
    form.append('accuracy', String(location.accuracy))
  }
  const res = await http.post('/attendance/check-in', form, { timeout: 60_000 })
  return { ...toCheckIn(unwrap(res)), message: res.data?.message ?? '' }
}

export async function getMyMonthly(month) {
  const res = await http.get('/attendance/me/monthly', { params: month ? { month } : {} })
  return toMonthly(unwrap(res))
}

// ---- Admin presensi ----

export async function listRecords({
  schoolId,
  date,
  classId,
  status,
  search,
  page = 1,
  limit = 25,
} = {}) {
  const params = scoped(schoolId, { page, limit })
  if (date) params.date = date
  if (classId) params.class_id = classId
  if (status) params.status = status
  if (search) params.search = search
  const res = await http.get('/attendance/records', { params })
  const { items, meta } = unwrapList(res)
  return { items: items.map(toDailyItem), meta }
}

/** Koreksi atau tambah manual; `late_minutes` hanya untuk status late. */
export async function correctRecord(studentId, date, values, { schoolId } = {}) {
  const body = { status: values.status, reason: values.reason }
  if (values.status === 'late') body.late_minutes = values.lateMinutes
  if (values.note) body.note = values.note
  const res = await http
    .put(`/attendance/records/${studentId}/${date}`, body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toRecord(unwrap(res))
}

export async function deleteRecord(studentId, date, reason, { schoolId } = {}) {
  await http
    .delete(`/attendance/records/${studentId}/${date}`, {
      data: { reason },
      params: scoped(schoolId),
    })
    .catch(rethrow)
}

export async function getSelfieUrl(studentId, date, { schoolId } = {}) {
  const res = await http.get(`/attendance/records/${studentId}/${date}/selfie`, {
    params: scoped(schoolId),
  })
  const data = unwrap(res) ?? {}
  return { url: data.url, expiresAt: data.expires_at ?? null }
}

export async function listUnassignedStudents({ schoolId } = {}) {
  const res = await http.get('/attendance/unassigned-students', { params: scoped(schoolId) })
  return (unwrap(res) ?? []).map((s) => ({
    studentId: s.student_id,
    name: s.name,
    nis: s.nis ?? null,
    nisn: s.nisn ?? null,
  }))
}

// ---- Rekap ----

export async function getSummaryToday({ schoolId } = {}) {
  const res = await http.get('/attendance/summary/today', { params: scoped(schoolId) })
  const data = unwrap(res) ?? {}
  return {
    date: data.date,
    isSchoolDay: Boolean(data.is_school_day),
    classes: (data.classes ?? []).map((c) => ({
      classId: c.class_id,
      className: c.class_name,
      total: c.total ?? 0,
      present: c.present ?? 0,
      late: c.late ?? 0,
      excused: c.excused ?? 0,
      sick: c.sick ?? 0,
      absent: c.absent ?? 0,
      notYet: c.not_yet ?? 0,
    })),
  }
}

export async function getClassReport(classId, month, { schoolId } = {}) {
  const params = scoped(schoolId, { class_id: classId })
  if (month) params.month = month
  const res = await http.get('/attendance/reports/class', { params })
  const data = unwrap(res) ?? {}
  return {
    classId: data.class_id,
    className: data.class_name,
    month: data.month,
    students: (data.students ?? []).map((s) => ({
      studentId: s.student_id,
      name: s.name,
      nis: s.nis ?? null,
      ...toSummary(s),
    })),
  }
}

export async function getStudentReport(studentId, month, { schoolId } = {}) {
  const res = await http.get(`/attendance/reports/students/${studentId}`, {
    params: scoped(schoolId, month ? { month } : {}),
  })
  return toMonthly(unwrap(res))
}

// ---- Pengaturan ----

export async function getSettings({ schoolId } = {}) {
  const res = await http.get('/attendance/settings', { params: scoped(schoolId) })
  return toSettings(unwrap(res))
}

export async function updateSettings(values, { schoolId } = {}) {
  const body = toSettingsBody(values)
  if (schoolId) body.school_id = schoolId
  const res = await http
    .put('/attendance/settings', body, { params: scoped(schoolId) })
    .catch(rethrow)
  return toSettings(unwrap(res))
}
