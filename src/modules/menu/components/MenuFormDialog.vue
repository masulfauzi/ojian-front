<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { createMenuSchema, updateMenuSchema } from '../schemas/menu.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = mode tambah; objek menu = mode ubah. */
  menu: { type: Object, default: null },
  /** Grup yang bisa menjadi induk halaman: [{ id, name }]. */
  groups: { type: Array, default: () => [] },
  /** (parentId) => urutan default untuk menu baru. */
  nextSortOrder: { type: Function, default: () => 10 },
  /** async (values) => void. Dialog menutup sendiri bila berhasil. */
  submit: { type: Function, required: true },
})

const TYPE_OPTIONS = [
  { value: 'page', label: 'Halaman' },
  { value: 'group', label: 'Grup' },
]

const isEdit = computed(() => Boolean(props.menu))

const form = useForm({
  validationSchema: computed(() =>
    toTypedSchema(isEdit.value ? updateMenuSchema : createMenuSchema),
  ),
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'code' } })
const notify = useNotify()

const type = computed(() => form.values.type)
const icon = computed(() => form.values.icon)
const parentOptions = computed(() =>
  props.groups.filter((g) => g.id !== props.menu?.id).map((g) => ({ value: g.id, label: g.name })),
)

function initialValues() {
  if (props.menu) {
    const { code, name, type, path, icon, parentId, sortOrder, isActive } = props.menu
    return { code, name, type, path: path ?? '', icon: icon ?? '', parentId, sortOrder, isActive }
  }
  return {
    code: '',
    name: '',
    type: 'page',
    path: '',
    icon: '',
    parentId: null,
    sortOrder: props.nextSortOrder(null),
  }
}

watch(visible, (open) => {
  if (open) form.resetForm({ values: initialValues() })
})

// Grup tidak punya path dan induk.
watch(type, (value) => {
  if (value === 'group') form.setValues({ path: '', parentId: null }, false)
})

// Menu baru: urutan default mengikuti induk yang dipilih.
watch(
  () => form.values.parentId,
  (parentId) => {
    if (!isEdit.value && visible.value)
      form.setFieldValue('sortOrder', props.nextSortOrder(parentId))
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
    :header="isEdit ? 'Ubah menu' : 'Tambah menu'"
    :style="{ width: 'min(40rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="menu-form" class="form-grid" novalidate @submit="onSubmit">
      <FormSelect
        name="type"
        label="Jenis"
        :options="TYPE_OPTIONS"
        :disabled="isEdit"
        hint="Grup mengelompokkan halaman di sidebar."
        required
      />
      <FormSelect
        v-if="type === 'page'"
        name="parentId"
        label="Induk (grup)"
        :options="parentOptions"
        placeholder="Tanpa induk"
        show-clear
      />
      <div v-else />
      <FormInputText name="name" label="Nama" placeholder="Bank Soal" required />
      <FormInputText
        name="code"
        label="Kode"
        placeholder="question_bank"
        hint="Kunci tetap untuk hak akses; sama dengan meta.menuCode di frontend."
        :disabled="isEdit && menu?.isSystem"
        required
      />
      <FormInputText
        v-if="type === 'page'"
        name="path"
        label="Path"
        placeholder="/question-bank"
        hint="Route frontend. Halaman tanpa route yang dikenal tidak tampil di sidebar."
        required
      />
      <div class="form-grid__icon">
        <FormInputText
          name="icon"
          label="Ikon"
          placeholder="pi pi-book"
          hint="Kelas PrimeIcons, mis. pi pi-book"
        />
        <span class="icon-preview" aria-hidden="true"><i :class="icon || 'pi pi-circle'" /></span>
      </div>
      <FormInputNumber name="sortOrder" label="Urutan" :min="0" :step="10" required />
      <FormSwitch v-if="isEdit" name="isActive" label="Status" />
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
          form="menu-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
