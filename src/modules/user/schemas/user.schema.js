import {
  optionalEmailField,
  optionalId,
  optionalString,
  passwordField,
  patternField,
  personNameField,
  z,
} from '@/shared/schemas/common'

const baseFields = {
  name: personNameField(),
  // NIS, NIP, atau nama login lain; unik per sekolah.
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

/** Role default (bila diisi) harus termasuk role yang dipilih. */
function defaultRoleRule(values, ctx) {
  if (values.defaultRoleId && !values.roleIds.includes(values.defaultRoleId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultRoleId'],
      message: 'harus salah satu role yang dipilih',
    })
  }
}

export const createUserSchema = z
  .object({ ...baseFields, password: passwordField() })
  .superRefine(defaultRoleRule)

export const updateUserSchema = z
  .object({ ...baseFields, isActive: z.boolean() })
  .superRefine(defaultRoleRule)
