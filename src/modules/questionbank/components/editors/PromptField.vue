<script setup>
import RichTextEditor from '@/shared/components/RichTextEditor.vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, default: 'Pertanyaan' },
  error: { type: String, default: '' },
  uploadImage: { type: Function, default: null },
  placeholder: { type: String, default: 'Tulis pertanyaan…' },
  minHeight: { type: String, default: '7rem' },
})
</script>

<template>
  <div class="form-field">
    <span class="form-field__label">{{ label }}<span class="form-field__required">*</span></span>
    <RichTextEditor
      v-model="model"
      :placeholder="placeholder"
      :upload-image="uploadImage"
      :min-height="minHeight"
    />
    <small v-if="error" class="form-field__error">{{ error }}</small>
  </div>
</template>
