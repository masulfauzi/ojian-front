<script setup>
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { loginSchema } from '../schemas/auth.schema'

const props = defineProps({
  /** async (values) => void — dipanggil dengan nilai yang sudah lolos validasi. */
  submit: { type: Function, required: true },
})

const form = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { login: '', password: '' },
})
const applyServerErrors = useServerErrors(form)
const formError = ref('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''
  try {
    await props.submit(values)
  } catch (error) {
    if (!applyServerErrors(error)) formError.value = error.message
  }
})
</script>

<template>
  <form class="form-stack" novalidate @submit="onSubmit">
    <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
    <FormInputText
      name="login"
      label="Email atau username"
      autocomplete="username"
      placeholder="Email, NISN, atau NIP"
      hint="Admin masuk dengan email. Siswa dengan NISN, guru dengan NIP atau username."
    />
    <FormPassword name="password" label="Password" autocomplete="current-password" />
    <Button
      type="submit"
      label="Masuk"
      icon="pi pi-sign-in"
      :loading="form.isSubmitting.value"
      :disabled="form.isSubmitting.value"
      fluid
    />
  </form>
</template>
