<script setup>
import { ref } from 'vue'
import Chip from 'primevue/chip'
import InputText from 'primevue/inputtext'

// Daftar teks pendek sebagai chip: ketik lalu Enter/koma untuk menambah, klik × untuk menghapus.
const model = defineModel({ type: Array, default: () => [] })

const props = defineProps({
  placeholder: { type: String, default: 'Ketik lalu Enter' },
  max: { type: Number, default: 50 },
  maxLength: { type: Number, default: 100 },
  inputId: { type: String, default: undefined },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** Normalisasi tiap nilai, mis. huruf kecil untuk tag. */
  normalize: { type: Function, default: (v) => v },
})

const draft = ref('')

function add() {
  const value = props.normalize(draft.value.trim()).slice(0, props.maxLength)
  draft.value = ''
  if (!value || model.value.includes(value) || model.value.length >= props.max) return
  model.value = [...model.value, value]
}

function remove(value) {
  model.value = model.value.filter((v) => v !== value)
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    add()
  } else if (event.key === 'Backspace' && !draft.value && model.value.length) {
    remove(model.value.at(-1))
  }
}
</script>

<template>
  <div class="tag-input" :class="{ 'is-invalid': invalid, 'is-disabled': disabled }">
    <Chip
      v-for="value in model"
      :key="value"
      :label="value"
      :removable="!disabled"
      @remove="remove(value)"
    />
    <InputText
      :id="inputId"
      v-model="draft"
      class="tag-input__field"
      :placeholder="model.length >= max ? '' : placeholder"
      :disabled="disabled || model.length >= max"
      unstyled
      @keydown="onKeydown"
      @blur="add"
    />
  </div>
</template>
