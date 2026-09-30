<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import Password from 'primevue/password'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <Password
      v-model="value"
      :input-id="id"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!errorMessage"
      :feedback="false"
      :input-props="{ autocomplete, 'aria-describedby': errorMessage ? `${id}-error` : undefined }"
      toggle-mask
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
