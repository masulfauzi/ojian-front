<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import TagInput from '@/shared/components/TagInput.vue'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { typeOf } from '../../types/definitions'
import { nextId } from '../../types/ids'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)
const [min, max] = typeOf('essay').limits.rubric

const rubric = computed(() => key.value.rubric ?? [])
const total = computed(() => rubric.value.reduce((sum, r) => sum + (Number(r.max_points) || 0), 0))

const patchRow = (index, patch) =>
  patchKey({ rubric: rubric.value.map((r, i) => (i === index ? { ...r, ...patch } : r)) })
const addRow = () =>
  patchKey({
    rubric: [...rubric.value, { id: nextId('k', rubric.value), criterion: '', max_points: 1 }],
  })
const removeRow = (index) => patchKey({ rubric: rubric.value.filter((_, i) => i !== index) })
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <div class="form-field" style="max-width: 16rem">
      <label class="form-field__label" for="essay-max">Panjang maksimal jawaban (karakter)</label>
      <InputNumber
        input-id="essay-max"
        :model-value="content.max_length ?? null"
        :min="1"
        :max="20000"
        :use-grouping="false"
        show-buttons
        fluid
        @update:model-value="(v) => patchContent({ max_length: v ?? 0 })"
      />
      <small v-if="errorAt('content.max_length')" class="form-field__error">{{
        errorAt('content.max_length')
      }}</small>
    </div>

    <div class="form-field">
      <div class="element-list__header">
        <span class="form-field__label"
          >Rubrik penilaian<span class="form-field__required">*</span></span
        >
        <span :class="total === points ? 'text-muted' : 'form-field__error'">
          Total {{ total }} / bobot soal {{ points }}
        </span>
      </div>
      <div v-for="(row, index) in rubric" :key="row.id" class="category-row">
        <InputText
          :model-value="row.criterion"
          :placeholder="`Kriteria ${index + 1}`"
          :invalid="!!errorAt(`answer_key.rubric[${index}]`)"
          :aria-label="`Kriteria ${index + 1}`"
          fluid
          @update:model-value="(criterion) => patchRow(index, { criterion })"
        />
        <InputNumber
          :model-value="row.max_points"
          :min="0"
          :max-fraction-digits="2"
          class="rubric-points"
          :aria-label="`Poin kriteria ${index + 1}`"
          @update:model-value="(v) => patchRow(index, { max_points: v ?? 0 })"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :disabled="rubric.length <= min"
          :aria-label="`Hapus kriteria ${index + 1}`"
          @click="removeRow(index)"
        />
      </div>
      <Message v-if="total !== points" severity="warn" :closable="false">
        Total poin rubrik harus sama dengan bobot soal ({{ points }}). Ubah poin rubrik atau bobot
        di kartu informasi soal.
      </Message>
      <small v-if="errorAt('answer_key.rubric')" class="form-field__error">{{
        errorAt('answer_key.rubric')
      }}</small>
      <div>
        <Button
          label="Tambah kriteria"
          icon="pi pi-plus"
          size="small"
          text
          :disabled="rubric.length >= max"
          @click="addRow"
        />
      </div>
    </div>

    <div class="form-field">
      <span class="form-field__label">Jawaban model (opsional, hanya untuk guru)</span>
      <RichTextEditor
        :model-value="key.model_answer ?? ''"
        :upload-image="uploadImage"
        min-height="5rem"
        @update:model-value="(model_answer) => patchKey({ model_answer })"
      />
    </div>
    <div class="form-field">
      <span class="form-field__label">Kata kunci (petunjuk bagi penilai)</span>
      <TagInput
        :model-value="key.keywords ?? []"
        @update:model-value="(keywords) => patchKey({ keywords })"
      />
    </div>
  </div>
</template>
