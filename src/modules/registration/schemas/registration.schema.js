import {
  emailField,
  optionalEmailField,
  optionalString,
  passwordField,
  patternField,
  personNameField,
  z,
} from '@/shared/schemas/common'
import { EDUCATION_LEVEL_OPTIONS } from '@/modules/school'

export const NPSN_PATTERN = /^[0-9]{8}$/

const EDUCATION_LEVELS = EDUCATION_LEVEL_OPTIONS.map((option) => option.value)

export const registrationSchema = z
  .object({
    // Langkah 1
    npsn: patternField(NPSN_PATTERN, 'NPSN harus 8 digit angka', { max: 8 }),

    // Langkah 2: data sekolah
    schoolName: z.string().trim().min(3).max(200),
    educationLevel: z.enum(EDUCATION_LEVELS, { required_error: 'wajib diisi' }),
    ownership: z
      .enum(['negeri', 'swasta'])
      .nullish()
      .transform((v) => v ?? null),
    address: optionalString(1000),
    city: optionalString(100),
    province: optionalString(100),
    postalCode: optionalString(10, { pattern: /^[0-9]+$/, message: 'kode pos hanya angka' }),
    schoolPhone: optionalString(30),
    schoolEmail: optionalEmailField(),

    // Langkah 3: akun admin sekolah
    adminName: personNameField(),
    adminUsername: patternField(
      /^[A-Za-z0-9._-]{3,50}$/,
      'hanya huruf, angka, titik, garis bawah, dan tanda hubung (3–50 karakter)',
      { min: 3, max: 50 },
    ),
    adminEmail: emailField(),
    adminPhone: optionalString(30),
    password: passwordField(),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'konfirmasi password tidak cocok',
  })

/** Field yang divalidasi di tiap langkah (urutan = urutan langkah). */
export const STEP_FIELDS = [
  ['npsn'],
  [
    'schoolName',
    'educationLevel',
    'ownership',
    'address',
    'city',
    'province',
    'postalCode',
    'schoolPhone',
    'schoolEmail',
  ],
  ['adminName', 'adminUsername', 'adminEmail', 'adminPhone', 'password', 'confirmPassword'],
]

/** Nilai awal form registrasi. */
export const emptyRegistration = () => ({
  ...Object.fromEntries(STEP_FIELDS.flat().map((field) => [field, ''])),
  educationLevel: null,
  ownership: null,
})

/** Nomor langkah (1-based) pertama yang memuat salah satu field, atau null. */
export function stepOfFields(fields) {
  const index = STEP_FIELDS.findIndex((stepFields) => stepFields.some((f) => fields.includes(f)))
  return index === -1 ? null : index + 1
}
