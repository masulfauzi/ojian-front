<script setup>
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { copyClassesSchema } from '../schemas/class.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** Tahun pelajaran tujuan { id, name }. */
  targetYear: { type: Object, default: null },
  /** Semua tahun pelajaran [{ id, name }]. */
  years: { type: Array, default: () => [] },
  submit: { type: Function, required: true },
})

const notify = useNotify()
const form = useForm({ validationSchema: toTypedSchema(copyClassesSchema) })

const sourceOptions = computed(() =>
  props.years
    .filter((y) => y.id !== props.targetYear?.id)
    .map((y) => ({ value: y.id, label: y.name })),
)

watch(visible, (open) => {
  if (open) {
    form.resetForm({
      values: { fromYearId: sourceOptions.value[0]?.value ?? null, toYearId: props.targetYear?.id },
    })
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await props.submit(values)
    visible.value = false
  } catch (error) {
    notify.error(error)
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Salin kelas dari tahun lain"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="copy-classes-form" class="form-stack" novalidate @submit="onSubmit">
      <Message severity="secondary" :closable="false">
        Nama dan tingkat kelas disalin ke <strong>{{ targetYear?.name }}</strong> tanpa wali kelas.
        Kelas dengan nama yang sudah ada dilewati, jadi aman diulang.
      </Message>
      <FormSelect
        name="fromYearId"
        label="Salin dari tahun pelajaran"
        :options="sourceOptions"
        placeholder="Pilih tahun asal"
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
          form="copy-classes-form"
          label="Salin kelas"
          icon="pi pi-copy"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value || !sourceOptions.length"
        />
      </div>
    </template>
  </Dialog>
</template>
