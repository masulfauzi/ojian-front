<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { EDUCATION_LEVEL_OPTIONS, OWNERSHIP_OPTIONS } from '../constants'
import { createSchoolSchema, updateSchoolSchema } from '../schemas/school.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = mode tambah; objek sekolah = mode ubah. */
  school: { type: Object, default: null },
  /** Admin sekolah tidak boleh mengubah kode dan status sekolahnya. */
  restricted: { type: Boolean, default: false },
  /** async (values) => void. Dialog menutup sendiri bila berhasil. */
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.school))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateSchoolSchema : createSchoolSchema),
  ),
})
// 409 bisa berasal dari kode atau NPSN yang sudah dipakai sekolah lain.
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: (error) => (/npsn/i.test(error.message) ? 'npsn' : 'code') },
})
const notify = useNotify()

const FIELDS = [
  'code',
  'name',
  'npsn',
  'educationLevel',
  'ownership',
  'address',
  'city',
  'province',
  'postalCode',
  'phone',
  'email',
  'logoUrl',
]

function initialValues() {
  const values = Object.fromEntries(FIELDS.map((key) => [key, props.school?.[key] ?? '']))
  values.educationLevel = props.school?.educationLevel ?? null
  values.ownership = props.school?.ownership ?? null
  if (props.school) values.isActive = props.school.isActive
  return values
}

watch(visible, (open) => {
  if (open) form.resetForm({ values: initialValues() })
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
    :header="isEdit ? 'Ubah sekolah' : 'Tambah sekolah'"
    :style="{ width: 'min(48rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="school-form" class="form-grid" novalidate @submit="onSubmit">
      <FormInputText
        name="code"
        label="Kode sekolah"
        placeholder="sman1-jkt"
        hint="Dipakai siswa saat login. Huruf kecil, angka, dan tanda hubung."
        :disabled="isEdit && restricted"
        required
      />
      <FormInputText name="npsn" label="NPSN" placeholder="8 digit angka" />
      <FormInputText
        class="form-grid__full"
        name="name"
        label="Nama sekolah"
        placeholder="SMA Negeri 1 Jakarta"
        required
      />
      <FormSelect
        name="educationLevel"
        label="Jenjang"
        :options="EDUCATION_LEVEL_OPTIONS"
        placeholder="Pilih jenjang"
        required
      />
      <FormSelect
        name="ownership"
        label="Status kepemilikan"
        :options="OWNERSHIP_OPTIONS"
        placeholder="Pilih"
        show-clear
      />
      <FormTextarea class="form-grid__full" name="address" label="Alamat" :rows="2" />
      <FormInputText name="city" label="Kota/Kabupaten" />
      <FormInputText name="province" label="Provinsi" />
      <FormInputText name="postalCode" label="Kode pos" />
      <FormInputText name="phone" label="Telepon" />
      <FormInputText name="email" label="Email" type="email" />
      <FormInputText name="logoUrl" label="URL logo" placeholder="https://…" />
      <FormSwitch v-if="isEdit && !restricted" name="isActive" label="Status" />
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
          form="school-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
