<script setup>
import Checkbox from 'primevue/checkbox'

// Aturan pencocokan jawaban teks (tanpa regex — sesuai backend).
const model = defineModel({ type: Object, default: () => ({}) })

const RULES = [
  { key: 'case_sensitive', label: 'Bedakan huruf besar/kecil', def: false },
  { key: 'trim', label: 'Abaikan spasi di awal/akhir', def: true },
  { key: 'collapse_spaces', label: 'Satukan spasi ganda', def: true },
  { key: 'ignore_diacritics', label: 'Abaikan tanda diakritik (é = e)', def: false },
]

const valueOf = (rule) => model.value?.[rule.key] ?? rule.def
const set = (rule, value) => (model.value = { ...model.value, [rule.key]: value })
</script>

<template>
  <div class="match-rules">
    <label v-for="rule in RULES" :key="rule.key" class="form-switch">
      <Checkbox :model-value="valueOf(rule)" binary @update:model-value="(v) => set(rule, v)" />
      {{ rule.label }}
    </label>
  </div>
</template>
