<script setup>
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import TagInput from '@/shared/components/TagInput.vue'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import MatchRulesEditor from './MatchRulesEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)
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
      <label class="form-field__label" for="sa-accepted"
        >Jawaban yang diterima<span class="form-field__required">*</span></label
      >
      <TagInput
        input-id="sa-accepted"
        :model-value="key.accepted ?? []"
        placeholder="Ketik jawaban lalu Enter"
        :max="50"
        :max-length="1000"
        :invalid="!!errorAt('answer_key.accepted')"
        @update:model-value="(accepted) => patchKey({ accepted })"
      />
      <small class="form-field__hint">
        Jawaban yang tidak cocok tidak langsung salah: diantrikan agar guru bisa memeriksanya.
      </small>
      <small v-if="errorAt('answer_key.accepted')" class="form-field__error">{{
        errorAt('answer_key.accepted')
      }}</small>
    </div>
    <MatchRulesEditor
      :model-value="key.match"
      @update:model-value="(match) => patchKey({ match })"
    />
    <div class="form-grid">
      <div class="form-field">
        <label class="form-field__label" for="sa-placeholder">Teks petunjuk di kotak jawaban</label>
        <InputText
          id="sa-placeholder"
          :model-value="content.placeholder ?? ''"
          fluid
          @update:model-value="(placeholder) => patchContent({ placeholder })"
        />
      </div>
      <div class="form-field">
        <label class="form-field__label" for="sa-max">Panjang maksimal jawaban</label>
        <InputNumber
          input-id="sa-max"
          :model-value="content.max_length ?? null"
          :min="1"
          :max="1000"
          :use-grouping="false"
          show-buttons
          fluid
          @update:model-value="(v) => patchContent({ max_length: v ?? 0 })"
        />
        <small v-if="errorAt('content.max_length')" class="form-field__error">{{
          errorAt('content.max_length')
        }}</small>
      </div>
    </div>
  </div>
</template>
