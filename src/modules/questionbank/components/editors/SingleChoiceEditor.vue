<script setup>
import RadioButton from 'primevue/radiobutton'
import ToggleSwitch from 'primevue/toggleswitch'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)
const [min, max] = typeOf('single_choice').limits.options

function onRemoved(id) {
  if (key.value.correct === id) patchKey({ correct: null })
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
    <ElementListEditor
      :model-value="content.options"
      label="Pilihan jawaban — tandai satu yang benar"
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
        <RadioButton
          :model-value="key.correct"
          :value="item.id"
          :aria-label="`Jawaban benar ${item.id}`"
          @update:model-value="(correct) => patchKey({ correct })"
        />
      </template>
    </ElementListEditor>
    <small v-if="errorAt('answer_key.correct')" class="form-field__error">{{
      errorAt('answer_key.correct')
    }}</small>
    <label class="form-switch">
      <ToggleSwitch
        :model-value="content.shuffle_options !== false"
        @update:model-value="(v) => patchContent({ shuffle_options: v })"
      />
      Acak urutan pilihan untuk tiap siswa
    </label>
  </div>
</template>
