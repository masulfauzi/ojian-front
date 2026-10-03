<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import SortableList from '@/shared/components/SortableList.vue'
import { nextId } from '../../types/ids'

/**
 * Daftar elemen soal { id, text, fixed? } (opsi, pernyataan, item): tulis dengan editor ringkas,
 * seret untuk mengurutkan, tambah/hapus dalam batas jumlah. Slot `marker` (kiri) dan `extra`
 * (kanan) untuk kunci jawaban per elemen.
 */
const model = defineModel({ type: Array, required: true })

const props = defineProps({
  label: { type: String, required: true },
  prefix: { type: String, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 10 },
  /** Path backend untuk pesan error, mis. 'content.options'. */
  errorPath: { type: String, required: true },
  errors: { type: Object, default: () => ({}) },
  uploadImage: { type: Function, default: null },
  /** Tampilkan centang "posisi tetap" (tidak ikut diacak). */
  allowFixed: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Tambah' },
  placeholder: { type: String, default: 'Tulis teks…' },
})

const emit = defineEmits(['added', 'removed'])

const listError = computed(() => props.errors[props.errorPath] ?? '')
const itemError = (index) => {
  const prefix = `${props.errorPath}[${index}]`
  const path = Object.keys(props.errors).find((p) => p === prefix || p.startsWith(`${prefix}.`))
  return path ? props.errors[path] : ''
}

const setText = (index, text) =>
  (model.value = model.value.map((el, i) => (i === index ? { ...el, text } : el)))

function setFixed(index, fixed) {
  model.value = model.value.map((el, i) => {
    if (i !== index) return el
    const { fixed: _old, ...rest } = el
    return fixed ? { ...rest, fixed: true } : rest
  })
}

function add() {
  const id = nextId(props.prefix, model.value)
  model.value = [...model.value, { id, text: '' }]
  emit('added', id)
}

function remove(index) {
  const id = model.value[index].id
  model.value = model.value.filter((_, i) => i !== index)
  emit('removed', id)
}
</script>

<template>
  <div class="element-list">
    <div class="element-list__header">
      <span class="form-field__label">{{ label }}</span>
      <span class="text-muted">{{ model.length }} / {{ max }}</span>
    </div>
    <SortableList v-model="model" handle=".element-handle" class="element-list__items">
      <template #item="{ item, index }">
        <div class="element-row" :class="{ 'has-error': itemError(index) }">
          <i class="pi pi-bars element-handle drag-handle" aria-label="Seret untuk mengurutkan" />
          <div v-if="$slots.marker" class="element-row__marker">
            <slot name="marker" :item="item" :index="index" />
          </div>
          <div class="element-row__body">
            <RichTextEditor
              :model-value="item.text"
              compact
              :placeholder="placeholder"
              :upload-image="uploadImage"
              @update:model-value="(text) => setText(index, text)"
            />
            <small v-if="itemError(index)" class="form-field__error">{{ itemError(index) }}</small>
          </div>
          <div v-if="$slots.extra" class="element-row__extra">
            <slot name="extra" :item="item" :index="index" />
          </div>
          <label
            v-if="allowFixed"
            v-tooltip.top="'Tidak ikut diacak (mis. \'Semua benar\')'"
            class="element-row__fixed"
          >
            <Checkbox
              :model-value="Boolean(item.fixed)"
              binary
              @update:model-value="(v) => setFixed(index, v)"
            />
            Tetap
          </label>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :disabled="model.length <= min"
            :aria-label="`Hapus ${item.id}`"
            @click="remove(index)"
          />
        </div>
      </template>
    </SortableList>
    <small v-if="listError" class="form-field__error">{{ listError }}</small>
    <div>
      <Button
        :label="addLabel"
        icon="pi pi-plus"
        size="small"
        text
        :disabled="model.length >= max"
        @click="add"
      />
    </div>
  </div>
</template>
