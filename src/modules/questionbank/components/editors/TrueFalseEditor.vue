<script setup>
import { computed } from 'vue'
import SelectButton from 'primevue/selectbutton'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import PromptField from './PromptField.vue'
import TrueFalseLabels from './TrueFalseLabels.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)

const options = computed(() => [
  { value: true, label: content.value.labels?.true || 'Benar' },
  { value: false, label: content.value.labels?.false || 'Salah' },
])
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      label="Pernyataan"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <TrueFalseLabels
      :model-value="content.labels"
      @update:model-value="(labels) => patchContent({ labels })"
    />
    <div class="form-field">
      <span class="form-field__label">Jawaban benar</span>
      <SelectButton
        :model-value="key.correct"
        :options="options"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Jawaban benar"
        @update:model-value="(correct) => patchKey({ correct })"
      />
      <small v-if="errorAt('answer_key.correct')" class="form-field__error">{{
        errorAt('answer_key.correct')
      }}</small>
    </div>
  </div>
</template>
