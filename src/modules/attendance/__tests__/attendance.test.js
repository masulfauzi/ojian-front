import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { toMonthly, toSettingsBody, toToday } from '../api/attendance.api'
import { toLeave, toLeaveBody } from '../api/leave.api'
import MonthCalendar from '../components/MonthCalendar.vue'
import { attendanceStatusOf } from '../constants'
import {
  correctionSchema,
  holidaySchema,
  leaveSchema,
  settingsSchema,
} from '../schemas/attendance.schema'
import { monthCells, percentText, wallTime } from '../utils/calendar'
import { checkInErrorField, leaveErrorField } from '../utils/errors'
import { fileProblem, fileSize } from '../utils/files'
import { summaryTotals } from '../utils/reports'

const SETTINGS = {
  opensAt: '05:30',
  onTimeUntil: '07:00',
  closesAt: '09:00',
  workDays: [5, 1, 3],
  requireSelfie: true,
  selfieRetentionDays: 30,
  geofenceMode: 'off',
  latitude: -6.2,
  longitude: 106.8,
  geofenceRadiusM: 200,
  maxGpsAccuracyM: 100,
  leaveProofRequired: true,
  leaveMaxDays: 14,
  leaveBackdateDays: 3,
}

describe('attendance.api', () => {
  it('memetakan keadaan hari ini', () => {
    const today = toToday({
      date: '2026-10-19',
      is_school_day: true,
      state: 'open',
      window: { opens_at: '05:30', on_time_until: '07:00', closes_at: '09:00' },
      require_selfie: true,
      geofence_mode: 'enforce',
      record: null,
      leave: { id: 'l', leave_type: 'sick', start_date: '2026-10-19', end_date: '2026-10-20' },
    })
    expect(today).toMatchObject({ state: 'open', geofenceMode: 'enforce', record: null })
    expect(today.window.onTimeUntil).toBe('07:00')
    expect(today.leave).toEqual({
      id: 'l',
      leaveType: 'sick',
      startDate: '2026-10-19',
      endDate: '2026-10-20',
    })
  })

  it('body pengaturan: hari kerja urut, geofence off tanpa koordinat', () => {
    const off = toSettingsBody(SETTINGS)
    expect(off.work_days).toEqual([1, 3, 5])
    expect(off).not.toHaveProperty('latitude')
    expect(off).not.toHaveProperty('geofence_radius_m')
    const on = toSettingsBody({ ...SETTINGS, geofenceMode: 'enforce' })
    expect(on).toMatchObject({ latitude: -6.2, longitude: 106.8, geofence_radius_m: 200 })
  })

  it('rekap bulanan: status null = belum presensi', () => {
    const m = toMonthly({
      month: '2026-10',
      summary: { school_days: 2, present: 1, attendance_percent: 50 },
      days: [{ date: '2026-10-19', status: null }],
    })
    expect(m.summary).toMatchObject({ schoolDays: 2, present: 1, late: 0, attendancePercent: 50 })
    expect(attendanceStatusOf(m.days[0].status).label).toBe('Belum presensi')
  })
})

describe('leave.api', () => {
  it('body pengajuan dan pemetaan respons', () => {
    expect(
      toLeaveBody({
        leaveType: 'sick',
        startDate: '2026-10-20',
        endDate: '2026-10-21',
        reason: 'Demam',
      }),
    ).toEqual({
      leave_type: 'sick',
      start_date: '2026-10-20',
      end_date: '2026-10-21',
      reason: 'Demam',
      media_ids: [],
    })
    const leave = toLeave({
      id: 'x',
      status: 'approved',
      files: [
        {
          media_id: 'm',
          original_name: 'surat.pdf',
          mime_type: 'application/pdf',
          size_bytes: 2048,
        },
      ],
      applied_days: 2,
    })
    expect(leave).toMatchObject({ status: 'approved', appliedDays: 2, fileCount: 1 })
    expect(leave.files[0]).toEqual({
      mediaId: 'm',
      originalName: 'surat.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
    })
  })
})

describe('schema', () => {
  it('pengaturan: urutan jam dan koordinat geofence', () => {
    expect(settingsSchema.safeParse(SETTINGS).success).toBe(true)
    const bad = settingsSchema.safeParse({ ...SETTINGS, onTimeUntil: '05:00', closesAt: '06:00' })
    expect(bad.error.issues.map((i) => i.path[0])).toContain('onTimeUntil')
    const geo = settingsSchema.safeParse({
      ...SETTINGS,
      geofenceMode: 'flag',
      latitude: null,
      geofenceRadiusM: null,
    })
    expect(geo.error.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(['latitude', 'geofenceRadiusM']),
    )
    expect(settingsSchema.safeParse({ ...SETTINGS, workDays: [] }).success).toBe(false)
  })

  it('izin, libur, koreksi', () => {
    const leave = leaveSchema.safeParse({
      leaveType: 'sick',
      startDate: '2026-10-21',
      endDate: '2026-10-20',
      reason: 'ab',
      mediaIds: [],
    })
    expect(leave.error.issues.map((i) => i.path[0]).sort()).toEqual(['endDate', 'reason'])
    expect(
      holidaySchema.safeParse({ name: 'Libur', startDate: '2026-12-01', endDate: '2026-12-01' })
        .success,
    ).toBe(true)
    const late = correctionSchema.safeParse({
      status: 'late',
      lateMinutes: null,
      reason: 'Terlambat',
    })
    expect(late.error.issues[0].path).toEqual(['lateMinutes'])
    expect(correctionSchema.safeParse({ status: 'sick', reason: 'Surat menyusul' }).success).toBe(
      true,
    )
  })
})

describe('utilitas', () => {
  it('kode error → bagian form', () => {
    expect(checkInErrorField({ code: 'OUTSIDE_GEOFENCE' })).toBe('location')
    expect(checkInErrorField({ code: 'SELFIE_DUPLICATE' })).toBe('selfie')
    expect(checkInErrorField({ code: 'ATTENDANCE_CLOSED' })).toBeNull()
    expect(leaveErrorField({ code: 'LEAVE_PROOF_REQUIRED' })).toBe('mediaIds')
    expect(leaveErrorField({ code: 'LEAVE_OVERLAP' })).toBe('startDate')
  })

  it('kalender: Senin di kolom pertama, hari non-sekolah', () => {
    // 1 Oktober 2026 = Kamis → 3 sel kosong di depan.
    const cells = monthCells('2026-10', [{ date: '2026-10-01', status: 'present' }])
    expect(cells.slice(0, 3)).toEqual([null, null, null])
    expect(cells[3]).toMatchObject({ date: '2026-10-01', day: 1, schoolDay: true })
    expect(cells[4]).toMatchObject({ date: '2026-10-02', schoolDay: false })
    expect(cells.length % 7).toBe(0)
    expect(wallTime('2026-10-19T07:12:03+07:00')).toBe('07.12')
    expect(wallTime(null)).toBe('-')
    expect(percentText(80)).toBe('80%')
    expect(percentText(null)).toBe('-')
  })

  it('berkas dan ringkasan', () => {
    expect(fileSize(4512)).toBe('4,4 KB')
    expect(fileProblem({ type: 'image/gif', size: 10 })).toMatch(/JPEG/)
    expect(fileProblem({ type: 'application/pdf', size: 6 * 1024 * 1024 })).toMatch(/5 MB/)
    expect(fileProblem({ type: 'image/png', size: 10 })).toBeNull()
    expect(
      summaryTotals([
        { total: 2, late: 1, notYet: 1 },
        { total: 3, present: 3 },
      ]),
    ).toMatchObject({
      total: 5,
      present: 3,
      late: 1,
      notYet: 1,
      absent: 0,
    })
  })
})

describe('MonthCalendar', () => {
  it('mewarnai hari sesuai status dan berpindah bulan', async () => {
    const wrapper = mount(MonthCalendar, {
      props: {
        month: '2026-10',
        'onUpdate:month': (value) => wrapper.setProps({ month: value }),
        days: [
          { date: '2026-10-01', status: 'present' },
          { date: '2026-10-02', status: 'absent' },
          { date: '2026-10-05', status: null },
        ],
        today: '2026-10-05',
        maxMonth: '2026-10',
      },
      global: { plugins: [PrimeVue], directives: { tooltip: Tooltip } },
    })
    expect(wrapper.findAll('.is-present')).toHaveLength(1)
    expect(wrapper.findAll('.is-absent')).toHaveLength(1)
    expect(wrapper.find('.is-today').classes()).toContain('is-none')
    expect(wrapper.find('[aria-label="Bulan berikutnya"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[aria-label="Bulan sebelumnya"]').trigger('click')
    expect(wrapper.props('month')).toBe('2026-09')
  })
})
