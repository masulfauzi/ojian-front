import { optionalId, optionalString, z } from '@/shared/schemas/common'

/** Metadata soal (isi soal divalidasi per jenis oleh backend lewat /questions/validate). */
export const questionMetaSchema = z.object({
  subjectId: z.string({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' }).min(1),
  gradeLevel: z
    .number()
    .int()
    .min(1)
    .max(13)
    .nullish()
    .transform((v) => v ?? null),
  topic: optionalString(200),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(3)
    .nullish()
    .transform((v) => v ?? null),
  cognitiveLevel: optionalString(10),
  visibility: z.enum(['private', 'school']),
  defaultPoints: z
    .number({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .min(0)
    .max(9999),
  stimulusId: optionalId(),
  scoringMode: z.enum(['all_or_nothing', 'partial']).default('all_or_nothing'),
  wrongPenalty: z.number().min(0).max(1).default(0),
})

export const stimulusSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().refine((v) => v.replace(/<[^>]+>/g, '').trim().length > 0 || /<img/i.test(v), {
    message: 'wajib diisi',
  }),
})
