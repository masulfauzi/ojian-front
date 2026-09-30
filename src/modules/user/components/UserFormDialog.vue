<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { PASSWORD_MAX, PASSWORD_MIN } from '@/shared/schemas/common'
import { ROLE_OPTIONS, ROLE_STUDENT } from '@/modules/auth'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = mode tambah; objek user = mode ubah. */
  user: { type: Object, default: null },
  /** async (values) => void. Dialog menutup sendiri bila berhasil. */
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.user))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateUserSchema : createUserSchema),
  ),
})
// 409 "Email sudah digunakan" tidak membawa detail field, jadi pasang ke field email.
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'email' } })
const notify = useNotify()

function initialValues() {
  if (props.user) {
    const { name, email, role, isActive } = props.user
    return { name, email, role, isActive }
  }
  return { name: '', email: '', password: '', role: ROLE_STUDENT }
}

watch(visible, (open) => {
  if (open) form.resetForm({ values: initialValues() })
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await props.submit(values)
    visible.value = false
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEdit ? 'Ubah user' : 'Tambah user'"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="user-form" class="form-stack" novalidate @submit="onSubmit">
      <FormInputText name="name" label="Nama" required />
      <FormInputText name="email" label="Email" type="email" autocomplete="off" required />
      <FormPassword
        v-if="!isEdit"
        name="password"
        label="Password awal"
        autocomplete="new-password"
        :hint="`${PASSWORD_MIN} sampai ${PASSWORD_MAX} karakter`"
        required
      />
      <FormSelect name="role" label="Role" :options="ROLE_OPTIONS" required />
      <FormSwitch v-if="isEdit" name="isActive" label="Status" />
    </form>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          :disabled="form.isSubmitting.value"
          @click="visible = false"
        />
        <Button
          type="submit"
          form="user-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
