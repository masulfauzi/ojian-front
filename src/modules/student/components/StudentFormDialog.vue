<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormDatePicker from '@/shared/components/form/FormDatePicker.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { conflictField } from '../api/student.api'
import { GENDER_OPTIONS, STUDENT_STATUSES } from '../constants'
import { createStudentSchema, updateStudentSchema } from '../schemas/student.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = tambah; objek siswa = ubah. */
  student: { type: Object, default: null },
  /** Kelas pada tahun pelajaran semester aktif [{ value, label }] (hanya saat tambah). */
  classOptions: { type: Array, default: () => [] },
  activeSemesterLabel: { type: String, default: '' },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.student))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateStudentSchema : createStudentSchema),
  ),
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: conflictField } })
const notify = useNotify()

const FIELDS = ['name', 'nis', 'nisn', 'birthPlace', 'birthDate', 'admissionDate', 'email']

watch(visible, (open) => {
  if (!open) return
  const values = Object.fromEntries(FIELDS.map((key) => [key, props.student?.[key] ?? '']))
  values.gender = props.student?.gender ?? null
  if (props.student) values.status = props.student.status
  else Object.assign(values, { password: '', classId: null })
  form.resetForm({ values })
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
    :header="isEdit ? 'Ubah siswa' : 'Tambah siswa'"
    :style="{ width: 'min(44rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="student-form" class="form-grid" novalidate @submit="onSubmit">
      <FormInputText class="form-grid__full" name="name" label="Nama lengkap" required />
      <FormInputText
        name="nisn"
        label="NISN"
        placeholder="10 digit"
        hint="Dipakai sebagai username login siswa."
        autocomplete="off"
        required
      />
      <FormInputText name="nis" label="NIS" placeholder="Nomor induk sekolah" required />
      <FormSelect
        name="gender"
        label="Jenis kelamin"
        :options="GENDER_OPTIONS"
        placeholder="Pilih"
        show-clear
      />
      <FormInputText name="birthPlace" label="Tempat lahir" />
      <FormDatePicker name="birthDate" label="Tanggal lahir" />
      <FormDatePicker name="admissionDate" label="Tanggal masuk" />
      <FormInputText name="email" label="Email" type="email" hint="Opsional." autocomplete="off" />

      <template v-if="!isEdit">
        <FormPassword
          name="password"
          label="Password awal"
          autocomplete="new-password"
          hint="Kosongkan agar dibuat otomatis. Siswa wajib menggantinya saat login pertama."
        />
        <FormSelect
          class="form-grid__full"
          name="classId"
          label="Kelas"
          :options="classOptions"
          :placeholder="
            classOptions.length ? 'Belum ditempatkan' : 'Belum ada kelas pada tahun ini'
          "
          :disabled="!classOptions.length"
          :hint="
            activeSemesterLabel
              ? `Penempatan untuk semester aktif ${activeSemesterLabel}.`
              : 'Belum ada semester aktif.'
          "
          show-clear
        />
      </template>
      <FormSelect
        v-else
        name="status"
        label="Status"
        :options="STUDENT_STATUSES"
        hint="Status selain Aktif menonaktifkan akun siswa."
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
          form="student-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
