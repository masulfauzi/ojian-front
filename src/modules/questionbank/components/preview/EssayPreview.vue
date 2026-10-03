<script setup>
import { computed } from 'vue'
import Textarea from 'primevue/textarea'

// essay → answer { html }. Pratinjau memakai teks biasa (dibungkus <p> saat disimpan nanti).
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
const max = computed(() => props.content.max_length || 20000)
const text = computed(() => (answer.value?.html ?? '').replace(/<[^>]+>/g, ''))
</script>

<template>
  <div class="form-field">
    <Textarea
      :model-value="text"
      rows="6"
      :maxlength="max"
      :disabled="disabled"
      auto-resize
      fluid
      aria-label="Jawaban uraian"
      @update:model-value="(v) => (answer = { html: v ? `<p>${v.replace(/[<>&]/g, '')}</p>` : '' })"
    />
    <small class="form-field__hint">{{ text.length }} / {{ max }} karakter</small>
  </div>
</template>
