import { optionalString, z } from '@/shared/schemas/common'

export const MAX_SECTIONS = 20

const sectionSchema = z.object({
  title: z.string().trim().max(200),
  instruction: optionalString(2000).transform((v) => v ?? ''),
})

export const examSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subjectId: z.string({ required_error: 'wajib diisi' }).min(1, 'wajib diisi'),
  gradeLevel: z.number().int().min(1).max(13).nullish(),
  description: optionalString(20000).transform((v) => v ?? ''),
  sections: z.array(sectionSchema).max(MAX_SECTIONS),
})
