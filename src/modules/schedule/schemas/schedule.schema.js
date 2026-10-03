import { z } from '@/shared/schemas/common'

const isoField = () =>
  z
    .string({ required_error: 'wajib diisi' })
    .min(1, 'wajib diisi')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'waktu tidak valid')

const optionalInt = (min, max) =>
  z
    .number()
    .int()
    .min(min)
    .max(max)
    .nullish()
    .transform((v) => v ?? null)

const afterStart = (v) => !v.startsAt || !v.endsAt || Date.parse(v.endsAt) > Date.parse(v.startsAt)

export const scheduleSchema = z
  .object({
    examId: z.string({ required_error: 'wajib diisi' }).min(1, 'wajib diisi'),
    semesterId: z.string({ required_error: 'wajib diisi' }).min(1, 'wajib diisi'),
    title: z.string().trim().min(3).max(200),
    category: z.string().min(1),
    startsAt: isoField(),
    endsAt: isoField(),
    durationMinutes: z
      .number({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
      .int()
      .min(1)
      .max(600),
    hardDeadline: z.boolean(),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    tokenEnabled: z.boolean(),
    tokenLength: z.number().int().min(4).max(10),
    tokenRotateMinutes: optionalInt(1, 240),
    maxAttempts: z.number().int().min(1).max(10),
    scorePolicy: z.enum(['best', 'latest', 'first']),
    passingScore: z
      .number()
      .min(0)
      .max(100)
      .nullish()
      .transform((v) => v ?? null),
    resultVisibility: z.enum(['hidden', 'after_submit', 'after_end', 'manual']),
    reviewVisibility: z.enum(['hidden', 'after_end', 'manual']),
  })
  .refine(afterStart, { path: ['endsAt'], message: 'harus setelah waktu mulai' })

export const remedialSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    startsAt: isoField(),
    endsAt: isoField(),
    durationMinutes: optionalInt(1, 600),
    threshold: z
      .number()
      .min(0)
      .max(100)
      .nullish()
      .transform((v) => v ?? null),
  })
  .refine(afterStart, { path: ['endsAt'], message: 'harus setelah waktu mulai' })

/** Nilai awal jadwal baru: mulai besok 07.30, selesai 2 jam kemudian (diisi oleh halaman). */
export const emptySchedule = () => ({
  examId: null,
  semesterId: null,
  title: '',
  category: 'daily',
  startsAt: '',
  endsAt: '',
  durationMinutes: 60,
  hardDeadline: true,
  shuffleQuestions: true,
  shuffleOptions: true,
  tokenEnabled: true,
  tokenLength: 6,
  tokenRotateMinutes: 15,
  maxAttempts: 1,
  scorePolicy: 'best',
  passingScore: 75,
  resultVisibility: 'after_end',
  reviewVisibility: 'hidden',
})

/** Menit di antara dua waktu ISO (untuk peringatan durasi > jendela waktu). */
export const windowMinutes = (startsAt, endsAt) => {
  const ms = Date.parse(endsAt) - Date.parse(startsAt)
  return Number.isFinite(ms) ? Math.floor(ms / 60000) : null
}
