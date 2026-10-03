<script setup>
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'
import DatePicker from 'primevue/datepicker'
import { DEFAULT_TIMEZONE, timezoneAbbr } from '@/shared/constants/timezones'
import { fromZonedInput, parseWallClockText, toZonedInput } from '@/shared/utils/zonedTime'
import FormField from './FormField.vue'

// Nilai form berupa string RFC 3339 dengan offset zona `timezone` (mis. zona sekolah), bukan
// zona perangkat. DatePicker bekerja dengan Date lokal, jadi jam dinding dikonversi dua arah.
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  timezone: { type: String, default: DEFAULT_TIMEZONE },
  placeholder: { type: String, default: 'dd/mm/yyyy hh:mm' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const { value, errorMessage, handleBlur } = useField(() => props.name)

const dateValue = computed({
  get: () => toZonedInput(value.value, props.timezone),
  set: (date) => (value.value = fromZonedInput(date, props.timezone) ?? ''),
})

// Waktu yang diketik manual diparse di sini (lihat parseWallClockText). Teks diambil dari event
// input karena saat blur DatePicker sudah mengembalikan isi input ke nilai lama.
let typedText = null
const onInput = (event) => (typedText = event?.target?.value ?? null)

function onBlur() {
  const typed = parseWallClockText(typedText)
  typedText = null
  if (typed) {
    const iso = fromZonedInput(typed, props.timezone)
    if (iso !== value.value) value.value = iso
  }
  handleBlur()
}
</script>

<template>
  <FormField :id="id" :label="label" :error="errorMessage" :hint="hint" :required="required">
    <DatePicker
      v-model="dateValue"
      :input-id="id"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!errorMessage"
      date-format="dd/mm/yy"
      hour-format="24"
      show-time
      show-icon
      icon-display="input"
      fluid
      @input="onInput"
      @blur="onBlur"
    >
      <template #footer>
        <small class="text-muted datetime-zone"
          >Zona waktu sekolah: {{ timezoneAbbr(timezone) }}</small
        >
      </template>
    </DatePicker>
  </FormField>
</template>
