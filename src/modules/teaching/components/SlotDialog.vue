<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { formatDate } from '@/shared/utils/format'
import { slotSchema } from '../schemas/teaching.schema'
import { fieldForCode } from '../utils/errors'
import { WEEKDAYS } from '../utils/timetable'

// Tambah/ubah slot jadwal. Mengubah kelas/mapel/hari/jam menjadikan slot "manual"; mengunci saja
// mempertahankan sumbernya (dikirim hanya field yang berubah).
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  /** Slot yang diubah; null = slot baru. */
  entry: { type: Object, default: null },
  /** Nilai awal slot baru (mis. dari klik sel kosong). */
  initial: { type: Object, default: null },
  classOptions: { type: Array, default: () => [] },
  subjectOptions: { type: Array, default: () => [] },
  /** Admin: pilihan guru; null = slot milik sendiri. */
  teacherOptions: { type: Array, default: null },
  maxPeriod: { type: Number, default: 12 },
  canUpdate: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: false },
  submit: { type: Function, required: true },
  remove: { type: Function, default: null },
})
const emit = defineEmits(['removed'])
const notify = useNotify()

const isEdit = computed(() => Boolean(props.entry))
const readonly = computed(() => isEdit.value && !props.canUpdate)
const form = useForm({ validationSchema: toTypedSchema(slotSchema) })
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: fieldForCode, 422: fieldForCode },
})
const dayOptions = WEEKDAYS.map((d) => ({ value: d.value, label: d.label }))

watch(visible, (open) => {
  if (!open) return
  const s = props.entry
  const i = props.initial ?? {}
  form.resetForm({
    values: {
      teacherId: s?.teacher?.id ?? i.teacherId ?? null,
      classId: s?.class?.id ?? i.classId ?? null,
      subjectId: s?.subject?.id ?? i.subjectId ?? null,
      dayOfWeek: s?.dayOfWeek ?? i.dayOfWeek ?? 1,
      periodFrom: s?.periodFrom ?? i.periodFrom ?? 1,
      periodTo: s?.periodTo ?? i.periodTo ?? 1,
      isLocked: s?.isLocked ?? false,
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

/** Hanya field yang berubah (UpdateSlotRequest): kunci saja tidak mengubah sumber slot. */
function changed(values) {
  if (!isEdit.value) return values
  const s = props.entry
  const before = {
    classId: s.class?.id,
    subjectId: s.subject?.id,
    dayOfWeek: s.dayOfWeek,
    periodFrom: s.periodFrom,
    periodTo: s.periodTo,
    isLocked: s.isLocked,
  }
  return Object.fromEntries(
    Object.entries(values).filter(([k, v]) => k in before && v !== before[k]),
  )
}

const onSubmit = form.handleSubmit(async (values) => {
  const payload = changed(values)
  if (isEdit.value && !Object.keys(payload).length) {
    visible.value = false
    return
  }
  try {
    await props.submit(payload)
    visible.value = false
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})

async function doRemove() {
  try {
    // `remove` mengembalikan false bila pengguna membatalkan konfirmasi.
    if ((await props.remove(props.entry)) === false) return
    visible.value = false
    emit('removed')
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEdit ? 'Slot jadwal' : 'Tambah slot jadwal'"
    :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="slot-form" class="form-stack" novalidate @submit="onSubmit">
      <Message v-if="entry?.source === 'generated'" severity="info" :closable="false">
        Dibentuk dari {{ entry.occurrences }} jurnal ({{ formatDate(entry.firstDate) }}–{{
          formatDate(entry.lastDate)
        }}). Mengubah kelas, mapel, hari, atau jam menjadikannya slot manual. Kunci slot agar tidak
        diganti saat jadwal dibentuk ulang.
      </Message>
      <FormSelect
        v-if="teacherOptions"
        name="teacherId"
        label="Guru"
        :options="teacherOptions"
        :disabled="isEdit"
        required
      />
      <div class="form-grid">
        <FormSelect
          name="classId"
          label="Kelas"
          :options="classOptions"
          :disabled="readonly"
          required
        />
        <FormSelect
          name="subjectId"
          label="Mata pelajaran"
          :options="subjectOptions"
          :disabled="readonly"
          required
        />
        <FormSelect
          name="dayOfWeek"
          label="Hari"
          :options="dayOptions"
          :disabled="readonly"
          required
        />
        <div class="form-grid">
          <FormInputNumber
            name="periodFrom"
            label="Jam ke"
            :min="1"
            :max="maxPeriod"
            :disabled="readonly"
            required
          />
          <FormInputNumber
            name="periodTo"
            label="Sampai"
            :min="1"
            :max="maxPeriod"
            :disabled="readonly"
            required
          />
        </div>
      </div>
      <FormSwitch
        name="isLocked"
        label="Kunci slot"
        on-label="Terkunci (dipertahankan saat dibentuk ulang)"
        off-label="Tidak dikunci"
        :disabled="readonly"
      />
    </form>
    <template #footer>
      <div class="dialog-footer">
        <Button
          v-if="isEdit && canDelete && remove"
          label="Hapus"
          icon="pi pi-trash"
          severity="danger"
          text
          :disabled="form.isSubmitting.value"
          @click="doRemove"
        />
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button
          v-if="!readonly"
          type="submit"
          form="slot-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
