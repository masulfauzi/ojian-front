<script setup>
import { useId } from 'vue'
import { useField } from 'vee-validate'
import ToggleSwitch from 'primevue/toggleswitch'
import FormField from './FormField.vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  onLabel: { type: String, default: 'Aktif' },
  offLabel: { type: String, default: 'Nonaktif' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage } = useField(() => props.name)
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint">
    <div class="form-switch">
      <ToggleSwitch v-model="value" :input-id="id" :disabled="disabled" :invalid="!!errorMessage" />
      <span>{{ value ? onLabel : offLabel }}</span>
    </div>
  </FormField>
</template>
