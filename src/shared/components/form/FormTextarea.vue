<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import Textarea from 'primevue/textarea'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 3 },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <Textarea
      :id="id"
      v-model="value"
      :name="name"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!errorMessage"
      auto-resize
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
