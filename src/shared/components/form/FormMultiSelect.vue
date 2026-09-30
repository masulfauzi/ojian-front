<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import MultiSelect from 'primevue/multiselect'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
  placeholder: { type: String, default: 'Pilih' },
  loading: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <MultiSelect
      v-model="value"
      :input-id="id"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      :invalid="!!errorMessage"
      display="chip"
      :show-toggle-all="false"
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
