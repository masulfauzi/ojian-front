import { existingPasswordField, passwordField, requiredString, z } from '@/shared/schemas/common'

export const loginSchema = z.object({
  // Email (admin) atau username unik global: NISN untuk siswa, NIP/nama login untuk guru.
  login: requiredString(255),
  password: existingPasswordField(),
})

export const changePasswordSchema = z
  .object({
    oldPassword: existingPasswordField(),
    newPassword: passwordField(),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'konfirmasi password tidak cocok',
  })
  .refine((v) => v.newPassword !== v.oldPassword, {
    path: ['newPassword'],
    message: 'tidak boleh sama dengan password lama',
  })
