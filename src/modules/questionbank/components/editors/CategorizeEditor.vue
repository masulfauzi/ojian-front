<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import { nextId } from '../../types/ids'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, patchBoth, errorAt } = useQuestionModel(props, emit)
const limits = typeOf('categorize').limits

const categoryOptions = computed(() =>
  content.value.categories.map((c, i) => ({ value: c.id, label: c.label || `Kategori ${i + 1}` })),
)

const setLabel = (index, label) =>
  patchContent({
    categories: content.value.categories.map((c, i) => (i === index ? { ...c, label } : c)),
  })

function addCategory() {
  patchContent({
    categories: [
      ...content.value.categories,
      { id: nextId('c', content.value.categories), label: '' },
    ],
  })
}

function removeCategory(index) {
  const removed = content.value.categories[index].id
  const placement = Object.fromEntries(
    Object.entries(key.value.placement ?? {}).map(([item, cat]) => [
      item,
      cat === removed ? null : cat,
    ]),
  )
  patchBoth({ categories: content.value.categories.filter((_, i) => i !== index) }, { placement })
}

function onItems(items) {
  const placement = Object.fromEntries(
    items.map((item) => [item.id, key.value.placement?.[item.id] ?? null]),
  )
  patchBoth({ items }, { placement })
}

const place = (itemId, cat) => patchKey({ placement: { ...key.value.placement, [itemId]: cat } })
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <div class="form-field">
      <span class="form-field__label"
        >Kategori ({{ content.categories.length }} / {{ limits.categories[1] }})</span
      >
      <div v-for="(cat, index) in content.categories" :key="cat.id" class="category-row">
        <InputText
          :model-value="cat.label"
          :placeholder="`Kategori ${index + 1}`"
          :invalid="!!errorAt(`content.categories[${index}]`)"
          :aria-label="`Nama kategori ${index + 1}`"
          fluid
          @update:model-value="(v) => setLabel(index, v)"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :disabled="content.categories.length <= limits.categories[0]"
          :aria-label="`Hapus kategori ${index + 1}`"
          @click="removeCategory(index)"
        />
      </div>
      <small v-if="errorAt('content.categories')" class="form-field__error">{{
        errorAt('content.categories')
      }}</small>
      <div>
        <Button
          label="Tambah kategori"
          icon="pi pi-plus"
          size="small"
          text
          :disabled="content.categories.length >= limits.categories[1]"
          @click="addCategory"
        />
      </div>
    </div>
    <ElementListEditor
      :model-value="content.items"
      label="Item — pilih kategorinya"
      prefix="i"
      :min="limits.items[0]"
      :max="limits.items[1]"
      error-path="content.items"
      :errors="errors"
      :upload-image="uploadImage"
      add-label="Tambah item"
      @update:model-value="onItems"
    >
      <template #extra="{ item }">
        <Select
          :model-value="key.placement?.[item.id] ?? null"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          placeholder="Kategori"
          class="matching-pair"
          :aria-label="`Kategori ${item.id}`"
          @update:model-value="(v) => place(item.id, v)"
        />
      </template>
    </ElementListEditor>
    <small v-if="errorAt('answer_key.placement')" class="form-field__error">{{
      errorAt('answer_key.placement')
    }}</small>
  </div>
</template>
