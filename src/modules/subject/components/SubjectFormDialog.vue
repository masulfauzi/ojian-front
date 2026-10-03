<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { conflictField } from '../api/subject.api'
import { createSubjectSchema, updateSubjectSchema } from '../schemas/subject.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  subject: { type: Object, default: null },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.subject))
const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateSubjectSchema : createSubjectSchema),
  ),
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: conflictField } })
const notify = useNotify()

watch(visible, (open) => {
  if (!open) return
  const s = props.subject
  form.resetForm({
    values: s ? { code: s.code, name: s.name, isActive: s.isActive } : { code: '', name: '' },
  })
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
    :header="isEdit ? 'Ubah mata pelajaran' : 'Tambah mata pelajaran'"
    :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="subject-form" class="form-stack" novalidate @submit="onSubmit">
      <FormInputText
        name="code"
        label="Kode"
        placeholder="MTK"
        hint="Singkatan unik di sekolah ini."
        required
      />
      <FormInputText name="name" label="Nama" placeholder="Matematika" required />
      <FormSwitch
        v-if="isEdit"
        name="isActive"
        label="Status"
        hint="Mata pelajaran nonaktif tidak bisa dipilih untuk soal baru."
      />
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
          form="subject-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
