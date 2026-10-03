<script setup>
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'
import DatePicker from 'primevue/datepicker'
import { fromISODate, toISODate } from '@/shared/utils/date'
import FormField from './FormField.vue'

// Nilai form berupa string 'YYYY-MM-DD' (format backend); DatePicker bekerja dengan Date.
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'dd/mm/yyyy' },
  /** 'YYYY-MM-DD' — batas tanggal yang bisa dipilih. */
  minDate: { type: String, default: null },
  maxDate: { type: String, default: null },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)

const dateValue = computed({
  get: () => fromISODate(value.value),
  set: (date) => (value.value = toISODate(date) ?? ''),
})
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <DatePicker
      v-model="dateValue"
      :input-id="id"
      :placeholder="placeholder"
      :min-date="fromISODate(minDate) ?? undefined"
      :max-date="fromISODate(maxDate) ?? undefined"
      :disabled="disabled"
      :invalid="!!errorMessage"
      date-format="dd/mm/yy"
      show-icon
      icon-display="input"
      show-button-bar
      fluid
      @blur="handleBlur"
    />
  </FormField>
</template>
