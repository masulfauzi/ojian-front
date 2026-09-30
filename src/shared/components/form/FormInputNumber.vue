<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import InputNumber from 'primevue/inputnumber'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <InputNumber
      v-model="value"
      :input-id="id"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :invalid="!!errorMessage"
      :use-grouping="false"
      show-buttons
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
