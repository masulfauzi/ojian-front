<script setup>
import { computed, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { formatDate } from '@/shared/utils/format'
import { ATTENDANCE_STATUSES } from '../constants'
import { correctionSchema } from '../schemas/attendance.schema'

// Koreksi atau tambah presensi manual (sumber "admin"); dicatat di riwayat dengan alasan.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  /** DailyItem siswa yang dikoreksi. */
  item: { type: Object, default: null },
  date: { type: String, required: true },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const form = useForm({ validationSchema: toTypedSchema(correctionSchema) })
const applyServerErrors = useServerErrors(form, { statusFields: { 422: 'reason' } })
const { value: status, errorMessage: statusError } = useField('status')
const options = ATTENDANCE_STATUSES.map(({ value, label }) => ({ value, label }))
const isNew = computed(() => !props.item?.status)

watch(visible, (open) => {
  if (!open || !props.item) return
  form.resetForm({
    values: {
      status: props.item.status ?? 'present',
      lateMinutes: props.item.lateMinutes ?? null,
      reason: '',
      note: '',
    },
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
    :header="isNew ? 'Tambah presensi manual' : 'Koreksi presensi'"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form v-if="item" id="correction-form" class="form-stack" novalidate @submit="onSubmit">
      <p class="text-muted">
        <strong>{{ item.name }}</strong> · {{ item.className ?? '-' }} · {{ formatDate(date) }}
      </p>
      <div class="form-field">
        <span class="form-field__label">Status</span>
        <SelectButton
          v-model="status"
          :options="options"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Status presensi"
          class="wrap-select"
        />
        <small v-if="statusError" class="form-field__error">{{ statusError }}</small>
      </div>
      <FormInputNumber
        v-if="status === 'late'"
        name="lateMinutes"
        label="Terlambat (menit)"
        :min="1"
        :max="1440"
        required
      />
      <FormTextarea
        name="reason"
        label="Alasan"
        :rows="2"
        placeholder="Mis. siswa hadir tetapi ponselnya rusak."
        hint="Dicatat di riwayat perubahan presensi."
        required
      />
      <FormTextarea name="note" label="Catatan" :rows="2" />
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
          form="correction-form"
          label="Simpan"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
