<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormDatePicker from '@/shared/components/form/FormDatePicker.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { journalSchema } from '../schemas/teaching.schema'
import { fieldForCode } from '../utils/errors'

/**
 * Tambah/ubah jurnal. `initial` mengisi otomatis (mis. dari slot "Jadwal hari ini").
 * Tanggal dibatasi server (tidak di masa depan, dalam jendela edit, di semester, hari sekolah).
 */
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  journal: { type: Object, default: null },
  initial: { type: Object, default: null },
  /** 'YYYY-MM-DD' — tanggal maksimal (hari ini). */
  today: { type: String, required: true },
  /** Rentang semester kerja. */
  semester: { type: Object, default: null },
  classOptions: { type: Array, default: () => [] },
  subjectOptions: { type: Array, default: () => [] },
  maxPeriod: { type: Number, default: 12 },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const isEdit = computed(() => Boolean(props.journal))
const form = useForm({ validationSchema: toTypedSchema(journalSchema) })
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: fieldForCode, 422: fieldForCode },
})

const maxDate = computed(() =>
  props.semester?.endDate && props.semester.endDate < props.today
    ? props.semester.endDate
    : props.today,
)

watch(visible, (open) => {
  if (!open) return
  const j = props.journal
  const i = props.initial ?? {}
  form.resetForm({
    values: {
      journalDate: j?.journalDate ?? i.journalDate ?? maxDate.value,
      periodFrom: j?.periodFrom ?? i.periodFrom ?? 1,
      periodTo: j?.periodTo ?? i.periodTo ?? i.periodFrom ?? 1,
      classId: j?.class?.id ?? i.classId ?? null,
      subjectId: j?.subject?.id ?? i.subjectId ?? null,
      topic: j?.topic ?? '',
      notes: j?.notes ?? '',
    },
  })
})

// Jam akhir mengikuti jam awal bila jadi lebih kecil.
watch(
  () => form.values.periodFrom,
  (from) => {
    if (from && (!form.values.periodTo || form.values.periodTo < from))
      form.setFieldValue('periodTo', from)
  },
)

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
    :header="isEdit ? 'Ubah jurnal' : 'Tambah jurnal'"
    :style="{ width: 'min(36rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="journal-form" class="form-stack" novalidate @submit="onSubmit">
      <div class="form-grid">
        <FormDatePicker
          name="journalDate"
          label="Tanggal"
          :min-date="semester?.startDate ?? null"
          :max-date="maxDate"
          required
        />
        <div class="form-grid">
          <FormInputNumber name="periodFrom" label="Jam ke" :min="1" :max="maxPeriod" required />
          <FormInputNumber name="periodTo" label="Sampai" :min="1" :max="maxPeriod" required />
        </div>
        <FormSelect
          name="classId"
          label="Kelas"
          :options="classOptions"
          placeholder="Pilih kelas"
          required
        />
        <FormSelect
          name="subjectId"
          label="Mata pelajaran"
          :options="subjectOptions"
          placeholder="Pilih mapel"
          required
        />
      </div>
      <FormTextarea
        name="topic"
        label="Materi"
        :rows="3"
        placeholder="Mis. pengantar basis data relasional: tabel, baris, dan kunci utama."
        required
      />
      <FormTextarea
        name="notes"
        label="Catatan"
        :rows="2"
        placeholder="Opsional. Mis. praktikum dilanjutkan pertemuan berikutnya."
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
          form="journal-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
