<script setup>
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { storage } from '@/shared/utils/storage'
import { loginSchema } from '../schemas/auth.schema'

const LAST_SCHOOL_CODE_KEY = 'last_school_code'

const props = defineProps({
  /** async (values) => void — dipanggil dengan nilai yang sudah lolos validasi. */
  submit: { type: Function, required: true },
})

const form = useForm({
  validationSchema: toTypedSchema(loginSchema),
  // Kode sekolah terakhir diingat agar siswa tidak perlu mengetik ulang.
  initialValues: { login: '', password: '', schoolCode: storage.get(LAST_SCHOOL_CODE_KEY, '') },
})
const applyServerErrors = useServerErrors(form)
const formError = ref('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''
  try {
    await props.submit(values)
    if (values.schoolCode) storage.set(LAST_SCHOOL_CODE_KEY, values.schoolCode)
    else storage.remove(LAST_SCHOOL_CODE_KEY)
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
      placeholder="nama@sekolah.sch.id atau NIS/NIP"
    />
    <FormPassword name="password" label="Password" autocomplete="current-password" />
    <FormInputText
      name="schoolCode"
      label="Kode sekolah"
      autocomplete="organization"
      placeholder="mis. sman1-jkt"
      hint="Wajib bila masuk dengan username. Kosongkan untuk admin platform."
    />
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
