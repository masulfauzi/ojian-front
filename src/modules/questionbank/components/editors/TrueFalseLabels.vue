<script setup>
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'

// Label pilihan benar/salah: preset umum atau ketik sendiri.
const model = defineModel({ type: Object, default: () => ({ true: 'Benar', false: 'Salah' }) })

const PRESETS = [
  { label: 'Benar/Salah', value: { true: 'Benar', false: 'Salah' } },
  { label: 'Ya/Tidak', value: { true: 'Ya', false: 'Tidak' } },
  { label: 'Fakta/Opini', value: { true: 'Fakta', false: 'Opini' } },
]
const set = (side, text) => (model.value = { ...model.value, [side]: text })
</script>

<template>
  <div class="form-field">
    <span class="form-field__label">Label pilihan</span>
    <div class="toolbar">
      <SelectButton
        :model-value="null"
        :options="PRESETS"
        option-label="label"
        option-value="value"
        aria-label="Preset label"
        @update:model-value="(v) => v && (model = { ...v })"
      />
      <InputText
        :model-value="model.true"
        aria-label="Label benar"
        class="tf-label"
        @update:model-value="(v) => set('true', v)"
      />
      <InputText
        :model-value="model.false"
        aria-label="Label salah"
        class="tf-label"
        @update:model-value="(v) => set('false', v)"
      />
    </div>
  </div>
</template>
