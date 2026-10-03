<script setup>
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)

const TOLERANCE_TYPES = [
  { value: 'absolute', label: 'Selisih angka' },
  { value: 'percent', label: 'Persen' },
]
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <div class="form-grid">
      <div class="form-field">
        <label class="form-field__label" for="num-value"
          >Jawaban benar<span class="form-field__required">*</span></label
        >
        <InputNumber
          input-id="num-value"
          :model-value="key.value"
          :max-fraction-digits="6"
          locale="id-ID"
          :invalid="!!errorAt('answer_key.value')"
          fluid
          @update:model-value="(value) => patchKey({ value })"
        />
        <small class="form-field__hint">Siswa boleh memakai koma desimal (mis. 3,14).</small>
        <small v-if="errorAt('answer_key.value')" class="form-field__error">{{
          errorAt('answer_key.value')
        }}</small>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="num-unit">Satuan (opsional)</label>
        <InputText
          id="num-unit"
          :model-value="content.unit_label ?? ''"
          placeholder="cm²"
          fluid
          @update:model-value="(unit_label) => patchContent({ unit_label })"
        />
      </div>
      <div class="form-field">
        <label class="form-field__label" for="num-tol">Toleransi</label>
        <InputNumber
          input-id="num-tol"
          :model-value="key.tolerance ?? 0"
          :min="0"
          :max-fraction-digits="6"
          locale="id-ID"
          fluid
          @update:model-value="(tolerance) => patchKey({ tolerance: tolerance ?? 0 })"
        />
        <small v-if="errorAt('answer_key.tolerance')" class="form-field__error">{{
          errorAt('answer_key.tolerance')
        }}</small>
      </div>
      <div class="form-field">
        <span class="form-field__label">Jenis toleransi</span>
        <SelectButton
          :model-value="key.tolerance_type ?? 'absolute'"
          :options="TOLERANCE_TYPES"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Jenis toleransi"
          @update:model-value="(tolerance_type) => patchKey({ tolerance_type })"
        />
      </div>
    </div>
  </div>
</template>
