import { describe, expect, it } from 'vitest'
import { toParticipant, toSchedule, toScheduleBody } from '../api/schedule.api'
import {
  emptySchedule,
  remedialSchema,
  scheduleSchema,
  windowMinutes,
} from '../schemas/schedule.schema'

const valid = () => ({
  ...emptySchedule(),
  examId: 'e1',
  semesterId: 's1',
  title: 'PTS Sesi 1',
  startsAt: '2026-10-05T07:00:00+07:00',
  endsAt: '2026-10-05T09:00:00+07:00',
})

describe('schedule schema', () => {
  it('menerima nilai bawaan yang lengkap', () => {
    expect(scheduleSchema.safeParse(valid()).success).toBe(true)
  })

  it('waktu tutup harus setelah waktu buka', () => {
    const result = scheduleSchema.safeParse({ ...valid(), endsAt: '2026-10-05T06:00:00+07:00' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['endsAt'])
  })

  it('rotasi token kosong = token tetap', () => {
    const parsed = scheduleSchema.parse({ ...valid(), tokenRotateMinutes: null })
    expect(parsed.tokenRotateMinutes).toBeNull()
    expect(toScheduleBody(parsed)).not.toHaveProperty('token_rotate_minutes')
  })

  it('remedial: batas nilai opsional', () => {
    const result = remedialSchema.parse({
      title: 'Remedial PTS',
      startsAt: '2026-10-05T07:00:00+07:00',
      endsAt: '2026-10-05T08:00:00+07:00',
      threshold: null,
    })
    expect(result.threshold).toBeNull()
    expect(windowMinutes(result.startsAt, result.endsAt)).toBe(60)
  })
})

describe('schedule.api', () => {
  it('body: token hanya bila aktif, KKM dikirim bila terisi', () => {
    const body = toScheduleBody({ ...valid(), tokenEnabled: false, passingScore: 0 })
    expect(body).toMatchObject({
      exam_id: 'e1',
      semester_id: 's1',
      starts_at: '2026-10-05T07:00:00+07:00',
      token_enabled: false,
      passing_score: 0,
    })
    expect(body).not.toHaveProperty('token_length')
    expect(toScheduleBody({ ...valid(), passingScore: null })).not.toHaveProperty('passing_score')
  })

  it('memetakan respons jadwal dan peserta', () => {
    const s = toSchedule({
      id: 'x',
      title: 'T',
      status: 'published',
      time_state: 'open',
      timezone: '',
      has_attempts: true,
      classes: [{ id: 'c', name: 'X-1', grade_level: 10 }],
    })
    expect(s).toMatchObject({ timezone: 'Asia/Jakarta', timeState: 'open', hasAttempts: true })
    expect(s.classes[0]).toEqual({ id: 'c', name: 'X-1', gradeLevel: 10 })
    expect(
      toParticipant({ student_id: 's', name: 'Siti', preview: true, note: null }),
    ).toMatchObject({
      studentId: 's',
      preview: true,
      note: '',
      status: 'eligible',
    })
  })
})
