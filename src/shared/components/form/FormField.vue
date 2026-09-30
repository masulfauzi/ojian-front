<script setup>
// Kerangka tampilan field: label, input (slot), pesan error atau petunjuk.
defineProps({
  id: { type: String, required: true },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
</script>

<template>
  <div class="form-field">
    <label v-if="label" :for="id" class="form-field__label">
      {{ label }}<span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>
    <slot />
    <small v-if="error" :id="`${id}-error`" class="form-field__error" role="alert">{{
      error
    }}</small>
    <small v-else-if="hint" class="form-field__hint">{{ hint }}</small>
  </div>
</template>
