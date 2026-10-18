import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { toJournal, toJournalBody, unwrapItems } from '../api/journal.api'
import { toCandidate, toSlot, toSlotBody } from '../api/teachingSchedule.api'
import TimetableGrid from '../components/TimetableGrid.vue'
import { journalSchema, journalSettingsSchema, slotSchema } from '../schemas/teaching.schema'
import { fieldForCode } from '../utils/errors'
import {
  isoDay,
  layoutDays,
  periodCount,
  periodLabel,
  slotsForDay,
  subjectColor,
  visibleDays,
} from '../utils/timetable'

const slot = (id, dayOfWeek, periodFrom, periodTo, extra = {}) => ({
  id,
  dayOfWeek,
  dayName: 'Senin',
  periodFrom,
  periodTo,
  source: 'generated',
  isLocked: false,
  class: { id: 'c', name: 'X-1' },
  subject: { id: `s-${id}`, name: `Mapel ${id}` },
  teacher: { id: 't', name: 'Bu Wali' },
  ...extra,
})

describe('journal.api', () => {
  it('daftar {items, semester} + meta', () => {
    const res = {
      data: {
        data: {
          semester: { id: 's1', term: 1, academic_year: '2026/2027', is_active: true },
          items: [
            {
              id: 'j',
              journal_date: '2026-10-19',
              day_name: 'Senin',
              period_from: 1,
              period_to: 2,
              class: { id: 'c', name: 'X-1' },
              subject: { id: 's', name: 'Informatika' },
              topic: 'Basis data',
              notes: null,
              editable: true,
              attendance_summary: { total: 2, present: 1, late: 1, not_yet: 0 },
            },
          ],
        },
        meta: { page: 1, limit: 50, total: 1, total_pages: 1 },
      },
    }
    const out = unwrapItems(res, toJournal)
    expect(out.semester).toMatchObject({ id: 's1', academicYear: '2026/2027', isActive: true })
    expect(out.items[0]).toMatchObject({ periods: 2, notes: '', editable: true })
    expect(out.items[0].attendance).toMatchObject({ total: 2, present: 1, late: 1, notYet: 0 })
    expect(out.meta.total).toBe(1)
  })

  it('body jurnal', () => {
    expect(
      toJournalBody({
        journalDate: '2026-10-19',
        periodFrom: 1,
        periodTo: 2,
        classId: 'c',
        subjectId: 's',
        topic: 'Basis data',
        notes: null,
      }),
    ).toEqual({
      journal_date: '2026-10-19',
      period_from: 1,
      period_to: 2,
      class_id: 'c',
      subject_id: 's',
      topic: 'Basis data',
      notes: '',
    })
  })
})

describe('teachingSchedule.api', () => {
  it('slot, kandidat, dan body ubah sebagian', () => {
    expect(toSlot({ id: 'x', source: 'manual', is_locked: true, day_of_week: 2 })).toMatchObject({
      source: 'manual',
      isLocked: true,
      dayOfWeek: 2,
    })
    const c = toCandidate({
      reason: 'conflict_with_manual',
      conflict_with: { schedule_id: 'k', period_from: 1, period_to: 2 },
    })
    expect(c.conflictWith).toEqual({ scheduleId: 'k', className: '', periodFrom: 1, periodTo: 2 })
    // Mengunci saja: hanya is_locked yang dikirim (sumber slot tetap).
    expect(toSlotBody({ isLocked: true })).toEqual({ is_locked: true })
    expect(
      toSlotBody({
        teacherId: 't',
        classId: 'c',
        subjectId: 's',
        dayOfWeek: 1,
        periodFrom: 1,
        periodTo: 2,
      }),
    ).toEqual({
      teacher_id: 't',
      class_id: 'c',
      subject_id: 's',
      day_of_week: 1,
      period_from: 1,
      period_to: 2,
    })
  })
})

describe('schema & error', () => {
  it('jurnal: jam akhir ≥ jam awal, materi minimal 3', () => {
    const r = journalSchema.safeParse({
      journalDate: '2026-10-19',
      periodFrom: 3,
      periodTo: 2,
      classId: 'c',
      subjectId: 's',
      topic: 'ab',
    })
    expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['periodTo', 'topic'])
    expect(
      slotSchema.safeParse({
        classId: 'c',
        subjectId: 's',
        dayOfWeek: 8,
        periodFrom: 1,
        periodTo: 1,
        isLocked: false,
      }).success,
    ).toBe(false)
    expect(
      journalSettingsSchema.safeParse({
        maxPeriod: 10,
        editWindowDays: 0,
        scheduleMinOccurrences: 2,
      }).success,
    ).toBe(true)
  })

  it('kode error → field', () => {
    expect(fieldForCode({ code: 'JOURNAL_DATE_FUTURE' })).toBe('journalDate')
    expect(fieldForCode({ code: 'JOURNAL_PERIOD_OVERLAP' })).toBe('periodFrom')
    expect(fieldForCode({ code: 'CLASS_NOT_IN_SEMESTER' })).toBe('classId')
    expect(fieldForCode({ code: 'SCHEDULE_OVERLAP' })).toBe('periodFrom')
    expect(fieldForCode({ code: 'JOURNAL_LOCKED' })).toBeNull()
  })
})

describe('timetable', () => {
  it('lajur untuk slot beririsan, slot berurutan satu lajur', () => {
    const days = layoutDays([
      slot('a', 1, 1, 2),
      slot('b', 1, 2, 3),
      slot('c', 1, 5, 5),
      slot('d', 2, 1, 1),
    ])
    const mon = days[1]
    expect(mon.map((p) => [p.slot.id, p.lane, p.lanes])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
      ['c', 0, 1],
    ])
    expect(days[2][0]).toMatchObject({ lane: 0, lanes: 1 })
  })

  it('hari, jam, label, warna', () => {
    expect(visibleDays([slot('a', 7, 1, 1)]).map((d) => d.value)).toEqual([1, 2, 3, 4, 5, 7])
    expect(periodCount([slot('a', 1, 1, 10)], 8)).toBe(10)
    expect(periodLabel(1, 1)).toBe('1')
    expect(periodLabel(1, 2)).toBe('1–2')
    expect(isoDay(new Date(2026, 9, 18))).toBe(7)
    expect(subjectColor('abc')).toBe(subjectColor('abc'))
    expect(slotsForDay([slot('b', 1, 3, 3), slot('a', 1, 1, 1)], 1).map((s) => s.id)).toEqual([
      'a',
      'b',
    ])
  })

  it('TimetableGrid menempatkan slot sesuai jam dan mengirim select', async () => {
    const wrapper = mount(TimetableGrid, {
      props: { slots: [slot('a', 1, 2, 3, { isLocked: true, source: 'manual' })], clickable: true },
    })
    const el = wrapper.find('.timetable__grid .timetable__slot')
    expect(el.attributes('style')).toContain('grid-row: 2 / 4')
    expect(el.classes()).toEqual(expect.arrayContaining(['is-manual', 'is-locked']))
    await el.trigger('click')
    expect(wrapper.emitted('select')[0][0].id).toBe('a')
  })
})
