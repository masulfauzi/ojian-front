<script setup>
import { computed, ref, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { uploadQuestionImage } from '../composables/useImageUpload'
import { resolveMediaHtml } from '../composables/useMediaResolver'
import { stimulusSchema } from '../schemas/question.schema'

const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  stimulus: { type: Object, default: null },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.stimulus))
const form = useForm({ validationSchema: toTypedSchema(stimulusSchema) })
const body = useField('body')
const notify = useNotify()
const ready = ref(false)

watch(visible, async (open) => {
  if (!open) return
  ready.value = false
  const s = props.stimulus
  form.resetForm({
    values: { title: s?.title ?? '', body: s ? await resolveMediaHtml(s.body) : '' },
  })
  ready.value = true
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
    :header="isEdit ? 'Ubah teks bacaan' : 'Tambah teks bacaan'"
    :style="{ width: 'min(52rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="stimulus-form" class="form-stack" novalidate @submit="onSubmit">
      <FormInputText
        name="title"
        label="Judul"
        placeholder="Teks bacaan: Hutan Mangrove"
        required
      />
      <div class="form-field">
        <span class="form-field__label">Isi bacaan<span class="form-field__required">*</span></span>
        <RichTextEditor
          v-if="ready"
          v-model="body.value.value"
          :upload-image="uploadQuestionImage"
          min-height="14rem"
        />
        <small v-if="body.errorMessage.value" class="form-field__error">{{
          body.errorMessage.value
        }}</small>
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
          form="stimulus-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
