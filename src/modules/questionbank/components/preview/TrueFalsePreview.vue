<script setup>
// true_false → answer { value: boolean }
const answer = defineModel('answer', { type: Object, default: null })
defineProps({
  content: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <div class="tf-choices" role="radiogroup">
    <button
      v-for="value in [true, false]"
      :key="String(value)"
      type="button"
      class="choice tf-choice"
      :class="{ 'is-selected': answer?.value === value }"
      role="radio"
      :aria-checked="answer?.value === value"
      :disabled="disabled"
      @click="answer = { value }"
    >
      {{ value ? content.labels?.true || 'Benar' : content.labels?.false || 'Salah' }}
    </button>
  </div>
</template>
