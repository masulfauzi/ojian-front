<script setup>
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { useNotify } from '@/shared/composables/useNotify'
import { PASSWORD_MAX, PASSWORD_MIN } from '@/shared/schemas/common'
import { changePasswordSchema } from '../schemas/auth.schema'

const props = defineProps({
  /** async ({ oldPassword, newPassword }) => void */
  submit: { type: Function, required: true },
})

const form = useForm({
  validationSchema: toTypedSchema(changePasswordSchema),
  initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
})
// "Password lama salah" dikirim backend sebagai 400 tanpa detail field.
const applyServerErrors = useServerErrors(form, { statusFields: { 400: 'oldPassword' } })
const notify = useNotify()

const onSubmit = form.handleSubmit(async ({ oldPassword, newPassword }) => {
  try {
    await props.submit({ oldPassword, newPassword })
    form.resetForm()
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <form class="form-stack" novalidate @submit="onSubmit">
    <FormPassword
      name="oldPassword"
      label="Password lama"
      autocomplete="current-password"
      required
    />
    <FormPassword
      name="newPassword"
      label="Password baru"
      autocomplete="new-password"
      :hint="`${PASSWORD_MIN} sampai ${PASSWORD_MAX} karakter`"
      required
    />
    <FormPassword
      name="confirmPassword"
      label="Konfirmasi password baru"
      autocomplete="new-password"
      required
    />
    <div>
      <Button
        type="submit"
        label="Simpan password"
        icon="pi pi-check"
        :loading="form.isSubmitting.value"
        :disabled="form.isSubmitting.value"
      />
    </div>
  </form>
</template>
