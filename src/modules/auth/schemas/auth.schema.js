import { emailField, existingPasswordField, passwordField, z } from '@/shared/schemas/common'

export const loginSchema = z.object({
  email: emailField(),
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
