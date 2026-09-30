import {
  optionalEmailField,
  optionalId,
  optionalString,
  passwordField,
  patternField,
  personNameField,
  z,
} from '@/shared/schemas/common'
import { loginIdentityIssues } from '../utils/roles'

const baseFields = {
  name: personNameField(),
  // Unik global: NISN untuk siswa, NIP atau nama login lain untuk guru.
  username: patternField(
    /^[A-Za-z0-9._-]{3,50}$/,
    'hanya huruf, angka, titik, garis bawah, dan tanda hubung (3–50 karakter)',
    { min: 3, max: 50 },
  ),
  email: optionalEmailField(),
  phone: optionalString(30),
  schoolId: optionalId(),
  roleIds: z.array(z.string(), { required_error: 'pilih minimal satu role' }).min(1, {
    message: 'pilih minimal satu role',
  }),
  defaultRoleId: optionalId(),
}

/**
 * Aturan lintas field:
 * - role default (bila diisi) harus termasuk role yang dipilih;
 * - identitas login sesuai role (siswa NISN, admin wajib email) bila `roleCodesOf` diberikan.
 */
const crossFieldRules = (roleCodesOf) => (values, ctx) => {
  if (values.defaultRoleId && !values.roleIds.includes(values.defaultRoleId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultRoleId'],
      message: 'harus salah satu role yang dipilih',
    })
  }
  if (!roleCodesOf) return
  const issues = loginIdentityIssues({
    roleCodes: roleCodesOf(values.roleIds),
    username: values.username,
    email: values.email,
  })
  for (const [field, message] of Object.entries(issues)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message })
  }
}

/**
 * @param {object} [options]
 * @param {(roleIds: string[]) => string[]} [options.roleCodesOf] Kode role dari id role yang dipilih.
 */
export const createUserSchema = ({ roleCodesOf } = {}) =>
  z.object({ ...baseFields, password: passwordField() }).superRefine(crossFieldRules(roleCodesOf))

export const updateUserSchema = ({ roleCodesOf } = {}) =>
  z.object({ ...baseFields, isActive: z.boolean() }).superRefine(crossFieldRules(roleCodesOf))
