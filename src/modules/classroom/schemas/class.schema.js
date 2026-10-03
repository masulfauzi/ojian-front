import { optionalId, z } from '@/shared/schemas/common'

const baseFields = {
  name: z.string().trim().min(1).max(50),
  // Tingkat divalidasi backend terhadap jenjang sekolah (SD 1–6, SMP 7–9, SMA 10–12, SMK 10–13).
  gradeLevel: z
    .number({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .int()
    .min(1)
    .max(13),
  homeroomUserId: optionalId(),
}

export const createClassSchema = z.object({
  ...baseFields,
  academicYearId: z
    .string({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .min(1),
})

export const updateClassSchema = z.object(baseFields)

export const copyClassesSchema = z
  .object({
    fromYearId: z
      .string({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
      .min(1),
    toYearId: z.string().min(1),
  })
  .refine((v) => v.fromYearId !== v.toYearId, {
    path: ['fromYearId'],
    message: 'pilih tahun pelajaran lain',
  })
