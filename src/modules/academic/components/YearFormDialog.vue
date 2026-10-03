<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormDatePicker from '@/shared/components/form/FormDatePicker.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { createYearSchema, updateYearSchema } from '../schemas/academic.schema'
import { defaultYearDates, startYearOf, suggestStartYear } from '../utils/dates'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = tambah (beserta dua semester); objek tahun = ubah nama dan rentang. */
  year: { type: Object, default: null },
  /** Nama tahun yang sudah ada, untuk menyarankan tahun berikutnya. */
  existingNames: { type: Array, default: () => [] },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.year))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(
      isEdit.value ? updateYearSchema({ semesters: props.year.semesters }) : createYearSchema,
    ),
  ),
})
// 409: tanggal beririsan dengan tahun lain atau nama sudah dipakai.
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: (error) => (/nama/i.test(error.message) ? 'name' : 'startDate') },
})
const notify = useNotify()

watch(visible, (open) => {
  if (!open) return
  if (props.year) {
    const { name, startDate, endDate } = props.year
    form.resetForm({ values: { name, startDate, endDate } })
  } else {
    form.resetForm({ values: defaultYearDates(suggestStartYear(props.existingNames)) })
  }
})

const canFillDefaults = computed(() => !isEdit.value && startYearOf(form.values.name) !== null)
const fillDefaults = () => form.setValues(defaultYearDates(startYearOf(form.values.name)))

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
    :header="isEdit ? 'Ubah tahun pelajaran' : 'Tambah tahun pelajaran'"
    :style="{ width: 'min(40rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="year-form" class="form-stack" novalidate @submit="onSubmit">
      <div class="form-grid__icon">
        <FormInputText name="name" label="Nama" placeholder="2026/2027" required />
        <Button
          v-if="!isEdit"
          v-tooltip.top="'Isi tanggal tahun dan semester sesuai kalender umum'"
          class="year-defaults"
          label="Isi tanggal standar"
          icon="pi pi-calendar"
          severity="secondary"
          text
          :disabled="!canFillDefaults"
          @click="fillDefaults"
        />
      </div>
      <div class="form-grid">
        <FormDatePicker name="startDate" label="Mulai" required />
        <FormDatePicker name="endDate" label="Selesai" required />
      </div>

      <template v-if="!isEdit">
        <h3 class="form-section-title">Semester Ganjil</h3>
        <div class="form-grid">
          <FormDatePicker name="ganjilStart" label="Mulai" required />
          <FormDatePicker name="ganjilEnd" label="Selesai" required />
        </div>
        <h3 class="form-section-title">Semester Genap</h3>
        <div class="form-grid">
          <FormDatePicker name="genapStart" label="Mulai" required />
          <FormDatePicker name="genapEnd" label="Selesai" required />
        </div>
      </template>
      <p v-else class="text-muted" style="margin: 0">
        Rentang baru harus tetap memuat kedua semester. Ubah tanggal semester lewat tombol di tiap
        semester.
      </p>
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
          form="year-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
