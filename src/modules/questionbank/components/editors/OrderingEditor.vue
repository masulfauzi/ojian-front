<script setup>
import { computed } from 'vue'
import Message from 'primevue/message'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import { itemsInOrder, scramble } from '../../types/ordering'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchBoth, errorAt } = useQuestionModel(props, emit)
const [min, max] = typeOf('ordering').limits.items

// Guru menyusun urutan BENAR; konten disimpan dalam urutan teracak (backend menolak urutan benar).
const ordered = computed(() => itemsInOrder(content.value.items, key.value.order))

function onItems(items) {
  const order = items.map((item) => item.id)
  const byId = new Map(items.map((item) => [item.id, item]))
  patchBoth({ items: scramble(order).map((id) => byId.get(id)) }, { order })
}
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <Message severity="secondary" :closable="false">
      Susun item dalam <strong>urutan yang benar</strong>. Urutan untuk siswa diacak otomatis.
    </Message>
    <ElementListEditor
      :model-value="ordered"
      label="Item (urutan benar dari atas ke bawah)"
      prefix="i"
      :min="min"
      :max="max"
      error-path="content.items"
      :errors="errors"
      :upload-image="uploadImage"
      add-label="Tambah item"
      @update:model-value="onItems"
    >
      <template #marker="{ index }">
        <span class="ordering-rank">{{ index + 1 }}</span>
      </template>
    </ElementListEditor>
    <small v-if="errorAt('answer_key.order')" class="form-field__error">{{
      errorAt('answer_key.order')
    }}</small>
  </div>
</template>
