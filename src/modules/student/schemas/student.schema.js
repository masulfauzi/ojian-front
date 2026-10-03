import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  optionalDateField,
  optionalEmailField,
  optionalId,
  optionalString,
  patternField,
  personNameField,
  z,
} from '@/shared/schemas/common'
import { STUDENT_STATUS_VALUES } from '../constants'

const baseFields = {
  name: personNameField(),
  // NIS unik per sekolah; NISN 10 digit dipakai sebagai username akun siswa.
  nis: patternField(
    /^[A-Za-z0-9._-]{1,20}$/,
    'hanya huruf, angka, titik, garis bawah, dan tanda hubung',
    { max: 20 },
  ),
  nisn: patternField(/^[0-9]{10}$/, 'NISN harus 10 digit angka', { max: 10 }),
  gender: z
    .enum(['L', 'P'])
    .nullish()
    .transform((v) => v ?? null),
  birthPlace: optionalString(100),
  birthDate: optionalDateField(),
  admissionDate: optionalDateField(),
  email: optionalEmailField(),
}

/** Password awal opsional: kosong → dibuat otomatis oleh backend. */
const optionalPassword = () =>
  z
    .string()
    .nullish()
    .transform((v) => v || null)
    .refine((v) => v === null || (v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX), {
      message: `harus ${PASSWORD_MIN}–${PASSWORD_MAX} karakter`,
    })

export const createStudentSchema = z.object({
  ...baseFields,
  password: optionalPassword(),
  classId: optionalId(),
})

export const updateStudentSchema = z.object({
  ...baseFields,
  status: z.enum(STUDENT_STATUS_VALUES, { required_error: 'wajib diisi' }),
})
