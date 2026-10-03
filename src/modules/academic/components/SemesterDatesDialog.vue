<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormDatePicker from '@/shared/components/form/FormDatePicker.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { semesterDatesSchema } from '../schemas/academic.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  semester: { type: Object, default: null },
  /** Tahun pelajaran pemilik semester (untuk batas tanggal). */
  year: { type: Object, default: null },
  submit: { type: Function, required: true },
})

const other = computed(() => props.year?.semesters.find((s) => s.id !== props.semester?.id) ?? null)

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(semesterDatesSchema({ year: props.year, other: other.value })),
  ),
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'startDate' } })
const notify = useNotify()

watch(visible, (open) => {
  if (open && props.semester) {
    const { startDate, endDate } = props.semester
    form.resetForm({ values: { startDate, endDate } })
  }
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
    :header="`Tanggal semester ${semester?.termName ?? ''} ${year?.name ?? ''}`"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="semester-form" class="form-grid" novalidate @submit="onSubmit">
      <FormDatePicker
        name="startDate"
        label="Mulai"
        :min-date="year?.startDate"
        :max-date="year?.endDate"
        required
      />
      <FormDatePicker
        name="endDate"
        label="Selesai"
        :min-date="year?.startDate"
        :max-date="year?.endDate"
        required
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
          form="semester-form"
          label="Simpan"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
