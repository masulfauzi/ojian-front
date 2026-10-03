<script setup>
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)
const [min, max] = typeOf('multiple_choice').limits.options

const isCorrect = (id) => (key.value.correct ?? []).includes(id)
function toggle(id, checked) {
  const current = key.value.correct ?? []
  patchKey({ correct: checked ? [...current, id] : current.filter((c) => c !== id) })
}
const onRemoved = (id) => isCorrect(id) && toggle(id, false)
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <ElementListEditor
      :model-value="content.options"
      label="Pilihan jawaban — centang semua yang benar"
      prefix="o"
      :min="min"
      :max="max"
      error-path="content.options"
      :errors="errors"
      :upload-image="uploadImage"
      allow-fixed
      add-label="Tambah pilihan"
      @update:model-value="(options) => patchContent({ options })"
      @removed="onRemoved"
    >
      <template #marker="{ item }">
        <Checkbox
          :model-value="isCorrect(item.id)"
          binary
          :aria-label="`Benar ${item.id}`"
          @update:model-value="(v) => toggle(item.id, v)"
        />
      </template>
    </ElementListEditor>
    <small v-if="errorAt('answer_key.correct')" class="form-field__error">{{
      errorAt('answer_key.correct')
    }}</small>
    <div class="form-grid">
      <div class="form-field">
        <label class="form-field__label" for="mc-min">Minimal dipilih siswa</label>
        <InputNumber
          input-id="mc-min"
          :model-value="content.min_select ?? 0"
          :min="0"
          :max="content.options.length"
          show-buttons
          fluid
          @update:model-value="(v) => patchContent({ min_select: v ?? 0 })"
        />
      </div>
      <div class="form-field">
        <label class="form-field__label" for="mc-max">Maksimal dipilih siswa</label>
        <InputNumber
          input-id="mc-max"
          :model-value="content.max_select ?? 0"
          :min="0"
          :max="content.options.length"
          show-buttons
          fluid
          @update:model-value="(v) => patchContent({ max_select: v ?? 0 })"
        />
        <small class="form-field__hint">0 = tanpa batas.</small>
        <small v-if="errorAt('content.max_select')" class="form-field__error">{{
          errorAt('content.max_select')
        }}</small>
      </div>
    </div>
    <label class="form-switch">
      <ToggleSwitch
        :model-value="content.shuffle_options !== false"
        @update:model-value="(v) => patchContent({ shuffle_options: v })"
      />
      Acak urutan pilihan untuk tiap siswa
    </label>
  </div>
</template>
