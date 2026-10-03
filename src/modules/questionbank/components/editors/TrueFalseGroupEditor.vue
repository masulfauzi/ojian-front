<script setup>
import { computed } from 'vue'
import SelectButton from 'primevue/selectbutton'
import ToggleSwitch from 'primevue/toggleswitch'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import ElementListEditor from './ElementListEditor.vue'
import PromptField from './PromptField.vue'
import TrueFalseLabels from './TrueFalseLabels.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, patchBoth, errorAt } = useQuestionModel(props, emit)
const [min, max] = typeOf('true_false_group').limits.statements

const options = computed(() => [
  { value: true, label: content.value.labels?.true || 'Benar' },
  { value: false, label: content.value.labels?.false || 'Salah' },
])

const setCorrect = (id, value) => patchKey({ correct: { ...key.value.correct, [id]: value } })

// Kunci selalu mengikuti daftar pernyataan (pernyataan baru default "benar").
function onStatements(statements) {
  const correct = Object.fromEntries(
    statements.map((s) => [s.id, key.value.correct?.[s.id] ?? true]),
  )
  patchBoth({ statements }, { correct })
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
    <TrueFalseLabels
      :model-value="content.labels"
      @update:model-value="(labels) => patchContent({ labels })"
    />
    <ElementListEditor
      :model-value="content.statements"
      label="Pernyataan dan kuncinya"
      prefix="s"
      :min="min"
      :max="max"
      error-path="content.statements"
      :errors="errors"
      :upload-image="uploadImage"
      add-label="Tambah pernyataan"
      @update:model-value="onStatements"
    >
      <template #extra="{ item }">
        <SelectButton
          :model-value="key.correct?.[item.id]"
          :options="options"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          size="small"
          :aria-label="`Kunci ${item.id}`"
          @update:model-value="(v) => setCorrect(item.id, v)"
        />
      </template>
    </ElementListEditor>
    <small v-if="errorAt('answer_key.correct')" class="form-field__error">{{
      errorAt('answer_key.correct')
    }}</small>
    <label class="form-switch">
      <ToggleSwitch
        :model-value="Boolean(content.shuffle_statements)"
        @update:model-value="(v) => patchContent({ shuffle_statements: v })"
      />
      Acak urutan pernyataan
    </label>
  </div>
</template>
