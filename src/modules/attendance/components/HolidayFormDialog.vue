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
import { holidaySchema } from '../schemas/attendance.schema'

// Libur satu hari: tanggal mulai = selesai. Libur panjang cukup satu baris.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  holiday: { type: Object, default: null },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const isEdit = computed(() => Boolean(props.holiday))
const form = useForm({ validationSchema: toTypedSchema(holidaySchema) })
const applyServerErrors = useServerErrors(form)

watch(visible, (open) => {
  if (!open) return
  const h = props.holiday
  form.resetForm({
    values: { name: h?.name ?? '', startDate: h?.startDate ?? '', endDate: h?.endDate ?? '' },
  })
})

// Mengisi tanggal mulai juga mengisi tanggal selesai yang masih kosong/lebih awal.
watch(
  () => form.values.startDate,
  (start) => {
    if (start && (!form.values.endDate || form.values.endDate < start))
      form.setFieldValue('endDate', start)
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
    :header="isEdit ? 'Ubah hari libur' : 'Tambah hari libur'"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="holiday-form" class="form-stack" novalidate @submit="onSubmit">
      <FormInputText name="name" label="Nama" placeholder="Libur semester ganjil" required />
      <div class="form-grid">
        <FormDatePicker name="startDate" label="Mulai" required />
        <FormDatePicker
          name="endDate"
          label="Sampai"
          :min-date="form.values.startDate || null"
          required
        />
      </div>
      <small class="form-field__hint"
        >Tidak mengubah presensi yang sudah tercatat. Pada hari libur siswa tidak perlu
        presensi.</small
      >
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
          form="holiday-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
