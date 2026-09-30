import { ROLES } from '@/shared/constants/roles'
import { emailField, passwordField, personNameField, z } from '@/shared/schemas/common'

const roleField = () => z.enum(ROLES, { required_error: 'wajib diisi' })

export const createUserSchema = z.object({
  name: personNameField(),
  email: emailField(),
  password: passwordField(),
  role: roleField(),
})

export const updateUserSchema = z.object({
  name: personNameField(),
  email: emailField(),
  role: roleField(),
  isActive: z.boolean(),
})
