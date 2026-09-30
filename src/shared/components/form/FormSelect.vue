<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import Select from 'primevue/select'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
  placeholder: { type: String, default: 'Pilih' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showClear: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <Select
      v-model="value"
      :input-id="id"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :show-clear="showClear"
      :invalid="!!errorMessage"
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
