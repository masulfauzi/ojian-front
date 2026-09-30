import { optionalId, optionalString, patternField, z } from '@/shared/schemas/common'

const fields = {
  code: patternField(
    /^[a-z][a-z0-9_.-]{1,49}$/,
    'diawali huruf kecil; hanya huruf kecil, angka, titik, garis bawah, dan tanda hubung',
    { min: 2, max: 50, lowercase: true },
  ),
  name: z.string().trim().min(2).max(100),
  type: z.enum(['group', 'page'], { required_error: 'wajib diisi' }),
  path: optionalString(255),
  icon: optionalString(50),
  parentId: optionalId(),
  sortOrder: z.number({ invalid_type_error: 'wajib diisi' }).int().min(0),
}

/** Aturan backend: halaman wajib punya path (diawali "/"); grup tanpa path dan tanpa induk. */
function structureRules(values, ctx) {
  if (values.type === 'page') {
    if (!values.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['path'],
        message: 'wajib diisi untuk halaman',
      })
    } else if (!values.path.startsWith('/')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['path'], message: 'harus diawali "/"' })
    }
  }
}

export const createMenuSchema = z.object(fields).superRefine(structureRules)

export const updateMenuSchema = z
  .object({ ...fields, isActive: z.boolean() })
  .superRefine(structureRules)
