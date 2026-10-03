<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { createClassSchema, updateClassSchema } from '../schemas/class.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = tambah; objek kelas = ubah. */
  classroom: { type: Object, default: null },
  /** Opsi tahun pelajaran [{ value, label }] (hanya saat tambah). */
  yearOptions: { type: Array, default: () => [] },
  defaultYearId: { type: String, default: null },
  /** Opsi guru [{ value, label }] untuk wali kelas. */
  teacherOptions: { type: Array, default: () => [] },
  teachersAvailable: { type: Boolean, default: true },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.classroom))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateClassSchema : createClassSchema),
  ),
})
// 409: nama kelas sudah dipakai di tahun pelajaran itu.
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'name' } })
const notify = useNotify()

watch(visible, (open) => {
  if (!open) return
  if (props.classroom) {
    const { name, gradeLevel, homeroomUserId } = props.classroom
    form.resetForm({ values: { name, gradeLevel, homeroomUserId } })
  } else {
    form.resetForm({
      values: {
        name: '',
        gradeLevel: null,
        homeroomUserId: null,
        academicYearId: props.defaultYearId,
      },
    })
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
    :header="isEdit ? 'Ubah kelas' : 'Tambah kelas'"
    :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="class-form" class="form-grid" novalidate @submit="onSubmit">
      <FormSelect
        v-if="!isEdit"
        class="form-grid__full"
        name="academicYearId"
        label="Tahun pelajaran"
        :options="yearOptions"
        required
      />
      <FormInputText name="name" label="Nama kelas" placeholder="X RPL 1" required />
      <FormInputNumber
        name="gradeLevel"
        label="Tingkat"
        :min="1"
        :max="13"
        hint="SD 1–6, SMP 7–9, SMA 10–12, SMK 10–13"
        required
      />
      <FormSelect
        class="form-grid__full"
        name="homeroomUserId"
        label="Wali kelas"
        :options="teacherOptions"
        :placeholder="teachersAvailable ? 'Tanpa wali kelas' : 'Tidak ada akses ke daftar guru'"
        :disabled="!teachersAvailable"
        :hint="teachersAvailable ? 'Hanya pengguna dengan role Guru di sekolah ini.' : ''"
        show-clear
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
          form="class-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
