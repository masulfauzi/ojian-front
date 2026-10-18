import { dateField, optionalString, z } from '@/shared/schemas/common'

const period = () =>
  z
    .number({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .int()
    .min(1)
    .max(20)
const requiredId = () => z.string({ required_error: 'wajib diisi' }).min(1, 'wajib diisi')
const fromBeforeTo = (v) => !v.periodFrom || !v.periodTo || v.periodTo >= v.periodFrom

export const journalSchema = z
  .object({
    journalDate: dateField(),
    periodFrom: period(),
    periodTo: period(),
    classId: requiredId(),
    subjectId: requiredId(),
    topic: z.string().trim().min(3).max(2000),
    notes: optionalString(2000),
  })
  .refine(fromBeforeTo, { path: ['periodTo'], message: 'tidak boleh sebelum jam awal' })

export const slotSchema = z
  .object({
    teacherId: z.string().nullish(),
    classId: requiredId(),
    subjectId: requiredId(),
    dayOfWeek: z.number({ required_error: 'wajib diisi' }).int().min(1).max(7),
    periodFrom: period(),
    periodTo: period(),
    isLocked: z.boolean(),
  })
  .refine(fromBeforeTo, { path: ['periodTo'], message: 'tidak boleh sebelum jam awal' })

export const journalSettingsSchema = z.object({
  maxPeriod: z.number({ invalid_type_error: 'wajib diisi' }).int().min(1).max(20),
  editWindowDays: z.number({ invalid_type_error: 'wajib diisi' }).int().min(0).max(120),
  scheduleMinOccurrences: z.number({ invalid_type_error: 'wajib diisi' }).int().min(1).max(20),
  principalName: optionalString(150),
  principalNip: optionalString(30),
  reportCity: optionalString(100),
})
