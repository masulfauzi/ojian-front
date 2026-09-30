import { optionalEmailField, optionalString, patternField, z } from '@/shared/schemas/common'
import { EDUCATION_LEVELS } from '../constants'

const baseFields = {
  code: patternField(
    /^[a-z0-9-]{3,30}$/,
    'hanya huruf kecil, angka, dan tanda hubung (3–30 karakter)',
    { min: 3, max: 30, lowercase: true },
  ),
  name: z.string().trim().min(3).max(200),
  npsn: optionalString(8, { pattern: /^[0-9]{8}$/, message: 'NPSN harus 8 digit angka' }),
  educationLevel: z.enum(EDUCATION_LEVELS, { required_error: 'wajib diisi' }),
  ownership: z
    .enum(['negeri', 'swasta'])
    .nullish()
    .transform((v) => v ?? null),
  address: optionalString(1000),
  city: optionalString(100),
  province: optionalString(100),
  postalCode: optionalString(10, { pattern: /^[0-9]+$/, message: 'kode pos hanya angka' }),
  phone: optionalString(30),
  email: optionalEmailField(),
  logoUrl: optionalString(2000, {
    pattern: /^https?:\/\/\S+$/i,
    message: 'harus URL yang diawali http:// atau https://',
  }),
}

export const createSchoolSchema = z.object(baseFields)

export const updateSchoolSchema = z.object({ ...baseFields, isActive: z.boolean() })
