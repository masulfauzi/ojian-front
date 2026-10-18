// Semua pemetaan kontrak endpoint /journals dan /journal-settings ada di file ini.
// Sumber: Swagger exam-api — tag "Jurnal Mengajar" dan "Rekap Jurnal" (journal.JournalRequest,
// JournalResponse, ListResponse, StudentsResponse, SummaryResponse, SettingsRequest).
// Semua data berbasis semester: `semester_id` (kosong = semester aktif sekolah).
import { http, unwrap } from '@/shared/api/http'
import { readBlobError, remapFieldErrors } from '@/shared/api/errors'
import { filenameFromDisposition } from '@/shared/utils/download'

const FIELD_MAP = {
  journal_date: 'journalDate',
  period_from: 'periodFrom',
  period_to: 'periodTo',
  class_id: 'classId',
  subject_id: 'subjectId',
  max_period: 'maxPeriod',
  edit_window_days: 'editWindowDays',
  schedule_min_occurrences: 'scheduleMinOccurrences',
  principal_name: 'principalName',
  principal_nip: 'principalNip',
  report_city: 'reportCity',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** Query bersama: sekolah (super admin) dan semester kerja. */
const scoped = ({ schoolId, semesterId } = {}, params = {}) => {
  const out = { ...params }
  if (schoolId) out.school_id = schoolId
  if (semesterId) out.semester_id = semesterId
  return out
}

const toRef = (data) => (data ? { id: data.id, name: data.name } : null)

export const toSemesterRef = (data) =>
  data
    ? {
        id: data.id,
        term: data.term,
        academicYear: data.academic_year ?? '',
        startDate: data.start_date ?? null,
        endDate: data.end_date ?? null,
        isActive: data.is_active ?? null,
      }
    : null

export const toAttendanceSummary = (data) =>
  data
    ? {
        total: data.total ?? 0,
        present: data.present ?? 0,
        late: data.late ?? 0,
        excused: data.excused ?? 0,
        sick: data.sick ?? 0,
        absent: data.absent ?? 0,
        notYet: data.not_yet ?? 0,
      }
    : null

export const toJournal = (data) => ({
  id: data.id,
  journalDate: data.journal_date,
  dayOfWeek: data.day_of_week,
  dayName: data.day_name ?? '',
  periodFrom: data.period_from,
  periodTo: data.period_to,
  periods: data.periods ?? data.period_to - data.period_from + 1,
  class: toRef(data.class),
  subject: toRef(data.subject),
  teacher: toRef(data.teacher),
  topic: data.topic ?? '',
  notes: data.notes ?? '',
  editable: Boolean(data.editable),
  attendance: toAttendanceSummary(data.attendance_summary),
  createdAt: data.created_at ?? null,
  updatedAt: data.updated_at ?? null,
})

export const toJournalBody = (values) => ({
  journal_date: values.journalDate,
  period_from: values.periodFrom,
  period_to: values.periodTo,
  class_id: values.classId,
  subject_id: values.subjectId,
  topic: values.topic,
  notes: values.notes || '',
})

/** Respons daftar `{ items, semester }` + meta paginasi. */
export function unwrapItems(res, map) {
  const data = res.data?.data ?? {}
  const meta = res.data?.meta ?? {}
  return {
    items: (data.items ?? []).map(map),
    semester: toSemesterRef(data.semester),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 50,
      total: meta.total ?? data.items?.length ?? 0,
      totalPages: meta.total_pages ?? 1,
    },
  }
}

function listParams({
  month,
  from,
  to,
  classId,
  subjectId,
  teacherId,
  search,
  page = 1,
  limit = 50,
}) {
  const params = { page, limit, include: 'attendance_summary' }
  if (month) params.month = month
  if (from) params.from = from
  if (to) params.to = to
  if (classId) params.class_id = classId
  if (subjectId) params.subject_id = subjectId
  if (teacherId) params.teacher_id = teacherId
  if (search) params.search = search
  return params
}

// ---- Guru ----

export async function listMyJournals(options = {}) {
  const res = await http.get('/journals/me', { params: scoped(options, listParams(options)) })
  return unwrapItems(res, toJournal)
}

export async function getJournal(id) {
  const res = await http.get(`/journals/${id}`)
  return toJournal(unwrap(res))
}

export async function createJournal(values, options = {}) {
  const res = await http
    .post('/journals', toJournalBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toJournal(unwrap(res))
}

export async function updateJournal(id, values, options = {}) {
  const res = await http
    .put(`/journals/${id}`, toJournalBody(values), { params: scoped(options) })
    .catch(rethrow)
  return toJournal(unwrap(res))
}

export async function deleteJournal(id) {
  await http.delete(`/journals/${id}`)
}

/** Ringkasan semester: pertemuan, jam pelajaran, per bulan, per kelas+mapel. */
export async function getMySummary(options = {}) {
  const res = await http.get('/journals/me/summary', { params: scoped(options) })
  const data = unwrap(res) ?? {}
  return {
    semester: toSemesterRef(data.semester),
    meetings: data.meetings ?? 0,
    periods: data.periods ?? 0,
    byMonth: (data.by_month ?? []).map((m) => ({
      month: m.month,
      meetings: m.meetings,
      periods: m.periods,
    })),
    byClassSubject: (data.by_class_subject ?? []).map((r) => ({
      class: toRef(r.class),
      subject: toRef(r.subject),
      meetings: r.meetings,
      periods: r.periods,
    })),
  }
}

// ---- Bersama (pemilik atau admin) ----

/** Siswa kelas + status presensi PAGI pada tanggal jurnal (bukan kehadiran per jam). */
export async function getJournalStudents(id, { schoolId } = {}) {
  const res = await http.get(`/journals/${id}/students`, { params: scoped({ schoolId }) })
  const data = unwrap(res) ?? {}
  return {
    journal: data.journal ? toJournal(data.journal) : null,
    summary: toAttendanceSummary(data.summary),
    students: (data.students ?? []).map((s) => ({
      studentId: s.student_id,
      nis: s.nis ?? null,
      name: s.name,
      status: s.status ?? null,
      source: s.source ?? null,
      checkedInAt: s.checked_in_at ?? null,
      lateMinutes: s.late_minutes ?? null,
    })),
  }
}

// ---- Admin ----

export async function listJournals(options = {}) {
  const res = await http.get('/journals', { params: scoped(options, listParams(options)) })
  return unwrapItems(res, toJournal)
}

// ---- Ekspor Excel ----

async function download(path, { from, to, includeAttendance = true, teacherId, ...options }) {
  const params = scoped(options, { include_attendance: includeAttendance })
  if (from) params.from = from
  if (to) params.to = to
  if (teacherId) params.teacher_id = teacherId
  try {
    const res = await http.get(path, { params, responseType: 'blob', timeout: 120_000 })
    return {
      blob: res.data,
      filename: filenameFromDisposition(
        res.headers?.['content-disposition'],
        'jurnal-mengajar.xlsx',
      ),
    }
  } catch (error) {
    throw await readBlobError(error)
  }
}

/** Jurnal saya sebagai .xlsx: { blob, filename }. */
export const exportMyJournals = (options = {}) => download('/journals/me/export', options)
/** Rekap admin (semua guru, atau satu guru dengan `teacherId`). */
export const exportJournals = (options = {}) => download('/journals/export', options)

// ---- Pengaturan ----

export const toJournalSettings = (data) => ({
  maxPeriod: data.max_period ?? 12,
  editWindowDays: data.edit_window_days ?? 14,
  scheduleMinOccurrences: data.schedule_min_occurrences ?? 2,
  principalName: data.principal_name ?? '',
  principalNip: data.principal_nip ?? '',
  reportCity: data.report_city ?? '',
})

export async function getJournalSettings({ schoolId } = {}) {
  const res = await http.get('/journal-settings', { params: scoped({ schoolId }) })
  return toJournalSettings(unwrap(res) ?? {})
}

export async function updateJournalSettings(values, { schoolId } = {}) {
  const body = {
    max_period: values.maxPeriod,
    edit_window_days: values.editWindowDays,
    schedule_min_occurrences: values.scheduleMinOccurrences,
    principal_name: values.principalName || '',
    principal_nip: values.principalNip || '',
    report_city: values.reportCity || '',
  }
  if (schoolId) body.school_id = schoolId
  const res = await http
    .put('/journal-settings', body, { params: scoped({ schoolId }) })
    .catch(rethrow)
  return toJournalSettings(unwrap(res) ?? {})
}
