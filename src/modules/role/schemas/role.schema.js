import { optionalId, optionalString, patternField, z } from '@/shared/schemas/common'

const baseFields = {
  code: patternField(
    /^[a-z][a-z0-9_]{1,49}$/,
    'diawali huruf kecil; hanya huruf kecil, angka, dan garis bawah',
    { min: 2, max: 50, lowercase: true },
  ),
  name: z.string().trim().min(2).max(100),
  description: optionalString(1000),
}

/**
 * @param {object} options
 * @param {boolean} options.requireSchool Pengguna platform wajib memilih sekolah untuk role kustom.
 */
export const createRoleSchema = ({ requireSchool = false } = {}) =>
  z.object({ ...baseFields, schoolId: optionalId() }).superRefine((values, ctx) => {
    if (requireSchool && !values.schoolId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['schoolId'], message: 'wajib diisi' })
    }
  })

export const updateRoleSchema = z.object({ ...baseFields, isActive: z.boolean() })
