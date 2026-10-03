<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, patchBoth, errorAt } = useQuestionModel(props, emit)
const limits = typeOf('matching').limits

// Label pilihan pasangan dari teks kolom kanan (tanpa tag HTML).
const plain = (html) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const rightOptions = computed(() =>
  content.value.right.map((r, i) => ({
    value: r.id,
    label: `${i + 1}. ${plain(r.text) || '(kosong)'}`,
  })),
)

const setPair = (leftId, rightId) => patchKey({ pairs: { ...key.value.pairs, [leftId]: rightId } })

function onLeft(left) {
  const pairs = Object.fromEntries(left.map((l) => [l.id, key.value.pairs?.[l.id] ?? null]))
  patchBoth({ left }, { pairs })
}

function onRight(right) {
  const ids = new Set(right.map((r) => r.id))
  const pairs = Object.fromEntries(
    Object.entries(key.value.pairs ?? {}).map(([l, r]) => [l, ids.has(r) ? r : null]),
  )
  patchBoth({ right }, { pairs })
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
    <div class="matching-columns">
      <ElementListEditor
        :model-value="content.left"
        label="Kolom kiri — pilih pasangannya"
        prefix="l"
        :min="limits.left[0]"
        :max="limits.left[1]"
        error-path="content.left"
        :errors="errors"
        :upload-image="uploadImage"
        add-label="Tambah item kiri"
        @update:model-value="onLeft"
      >
        <template #extra="{ item }">
          <Select
            :model-value="key.pairs?.[item.id] ?? null"
            :options="rightOptions"
            option-label="label"
            option-value="value"
            placeholder="Pasangan"
            class="matching-pair"
            :aria-label="`Pasangan ${item.id}`"
            @update:model-value="(v) => setPair(item.id, v)"
          />
        </template>
      </ElementListEditor>
      <ElementListEditor
        :model-value="content.right"
        label="Kolom kanan (boleh berisi pengecoh)"
        prefix="r"
        :min="limits.right[0]"
        :max="limits.right[1]"
        error-path="content.right"
        :errors="errors"
        :upload-image="uploadImage"
        add-label="Tambah item kanan"
        @update:model-value="onRight"
      />
    </div>
    <small v-if="errorAt('answer_key.pairs')" class="form-field__error">{{
      errorAt('answer_key.pairs')
    }}</small>
    <label class="form-switch">
      <ToggleSwitch
        :model-value="Boolean(content.allow_reuse)"
        @update:model-value="(v) => patchContent({ allow_reuse: v })"
      />
      Satu item kanan boleh dipakai lebih dari sekali
    </label>
  </div>
</template>
