<script setup>
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormDateTimePicker from '@/shared/components/form/FormDateTimePicker.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { fromZonedInput, toZonedISO } from '@/shared/utils/zonedTime'
import { createRemedial } from '../api/schedule.api'
import { remedialSchema } from '../schemas/schedule.schema'

// Buat jadwal remedial (draf) dari jadwal asal: peserta = siswa yang nilai terbaiknya di bawah
// batas atau belum mengerjakan. Pengaturan lain disalin dari jadwal asal.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  schedule: { type: Object, required: true },
  schoolId: { type: String, default: null },
})
const emit = defineEmits(['created'])
const notify = useNotify()

const form = useForm({ validationSchema: toTypedSchema(remedialSchema) })
const applyServerErrors = useServerErrors(form)

watch(visible, (open) => {
  if (!open) return
  const tz = props.schedule.timezone
  const d = new Date()
  const start = fromZonedInput(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7, 7, 0), tz)
  form.resetForm({
    values: {
      title: `Remedial ${props.schedule.title}`.slice(0, 200),
      startsAt: start,
      endsAt: toZonedISO(Date.parse(start) + 2 * 3600e3, tz),
      durationMinutes: props.schedule.durationMinutes,
      threshold: props.schedule.passingScore,
    },
  })
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const created = await createRemedial(props.schedule.id, values, { schoolId: props.schoolId })
    notify.success('Jadwal remedial dibuat sebagai draf')
    visible.value = false
    emit('created', created)
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Buat jadwal remedial"
    :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="remedial-form" class="form-stack" novalidate @submit="onSubmit">
      <p class="text-muted">
        Peserta: siswa jadwal ini dengan nilai di bawah batas, atau yang belum mengerjakan. Paket,
        pengacakan, token, dan aturan hasil disalin dari jadwal asal.
      </p>
      <FormInputText name="title" label="Judul" required />
      <div class="form-grid">
        <FormDateTimePicker name="startsAt" label="Dibuka" :timezone="schedule.timezone" required />
        <FormDateTimePicker name="endsAt" label="Ditutup" :timezone="schedule.timezone" required />
        <FormInputNumber name="durationMinutes" label="Durasi (menit)" :min="1" :max="600" />
        <FormInputNumber
          name="threshold"
          label="Batas nilai (%)"
          :min="0"
          :max="100"
          hint="Kosong = KKM jadwal asal."
        />
      </div>
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
          form="remedial-form"
          label="Buat remedial"
          icon="pi pi-replay"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
