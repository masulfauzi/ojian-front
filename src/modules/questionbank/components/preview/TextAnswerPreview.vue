<script setup>
import InputText from 'primevue/inputtext'

// short_answer / numeric → answer { text }
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  numeric: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const max = props.numeric ? 50 : props.content.max_length || 1000
</script>

<template>
  <div class="text-answer">
    <InputText
      :model-value="answer?.text ?? ''"
      :placeholder="content.placeholder || (numeric ? 'Tulis angka, mis. 3,14' : 'Jawaban')"
      :maxlength="max"
      :inputmode="numeric ? 'decimal' : 'text'"
      :disabled="disabled"
      aria-label="Jawaban"
      class="text-answer__input"
      @update:model-value="(text) => (answer = { text })"
    />
    <span v-if="numeric && content.unit_label" class="text-answer__unit">{{
      content.unit_label
    }}</span>
  </div>
</template>
