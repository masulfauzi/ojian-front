<script setup>
import { computed, useId, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormField from '@/shared/components/form/FormField.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { SchoolSelect } from '@/modules/school'
import { createRoleSchema, updateRoleSchema } from '../schemas/role.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = mode tambah; objek role = mode ubah. */
  role: { type: Object, default: null },
  /** Pengguna platform memilih sekolah pemilik role kustom. */
  chooseSchool: { type: Boolean, default: false },
  /** async (values) => void. Dialog menutup sendiri bila berhasil. */
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.role))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(
      isEdit.value ? updateRoleSchema : createRoleSchema({ requireSchool: props.chooseSchool }),
    ),
  ),
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'code' } })
const notify = useNotify()

const schoolFieldId = useId()
const school = useField('schoolId')

function initialValues() {
  if (props.role) {
    const { code, name, description, isActive } = props.role
    return { code, name, description: description ?? '', isActive }
  }
  return { code: '', name: '', description: '', schoolId: null }
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
    :header="isEdit ? 'Ubah role' : 'Tambah role'"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="role-form" class="form-stack" novalidate @submit="onSubmit">
      <FormField
        v-if="!isEdit && chooseSchool"
        :id="schoolFieldId"
        label="Sekolah"
        :error="school.errorMessage.value"
        hint="Role kustom selalu milik satu sekolah."
        required
      >
        <SchoolSelect
          v-model="school.value.value"
          :input-id="schoolFieldId"
          :invalid="!!school.errorMessage.value"
          active-only
        />
      </FormField>
      <FormInputText name="name" label="Nama role" placeholder="Wali Kelas" required />
      <FormInputText
        name="code"
        label="Kode"
        placeholder="wali_kelas"
        hint="Huruf kecil, angka, dan garis bawah. Tidak boleh sama dengan role sistem."
        :disabled="isEdit && role?.isSystem"
        required
      />
      <FormTextarea name="description" label="Deskripsi" :rows="2" />
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
          form="role-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
