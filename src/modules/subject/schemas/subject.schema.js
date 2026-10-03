import { z } from '@/shared/schemas/common'

const baseFields = {
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(2).max(150),
}

export const createSubjectSchema = z.object(baseFields)

export const updateSubjectSchema = z.object({ ...baseFields, isActive: z.boolean() })
