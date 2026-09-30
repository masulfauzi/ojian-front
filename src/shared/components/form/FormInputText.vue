<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import InputText from 'primevue/inputtext'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <InputText
      :id="id"
      v-model="value"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :invalid="!!errorMessage"
      :aria-describedby="errorMessage ? `${id}-error` : undefined"
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
