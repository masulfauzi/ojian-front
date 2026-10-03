<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import RadioButton from 'primevue/radiobutton'
import SelectButton from 'primevue/selectbutton'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import TagInput from '@/shared/components/TagInput.vue'
import { editorProps, useQuestionModel } from '../../composables/useQuestionModel'
import { emptyBlankKey, syncBlanks } from '../../types/fillBlank'
import { nextId } from '../../types/ids'
import MatchRulesEditor from './MatchRulesEditor.vue'
import PromptField from './PromptField.vue'

const props = defineProps(editorProps)
const emit = defineEmits(['update:modelValue'])
const { content, key, patchContent, patchBoth, errorAt } = useQuestionModel(props, emit)

const KINDS = [
  { value: 'text', label: 'Diketik' },
  { value: 'select', label: 'Pilihan' },
]
const UIS = [
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'drag', label: 'Seret kata' },
]

const templateEditor = ref()

// Daftar rumpang dan kuncinya selalu mengikuti penanda {{id}} di template.
function onTemplate(template) {
  const synced = syncBlanks(template, content.value.blanks, key.value.blanks)
  patchBoth({ template, blanks: synced.blanks }, { blanks: synced.keyBlanks })
}

function insertBlank() {
  templateEditor.value?.insertText(`{{${nextId('b', content.value.blanks)}}}`)
}

// Ditulis lewat v-text: kurung kurawal ganda bentrok dengan interpolasi template.
const blankLabel = (id) => `{{${id}}}`

const blankKey = (id) => key.value.blanks?.[id] ?? {}

function patchBlank(index, patch) {
  const blanks = content.value.blanks.map((b, i) => (i === index ? { ...b, ...patch } : b))
  patchContent({ blanks })
}

function setKind(index, kind) {
  const blank = content.value.blanks[index]
  const next =
    kind === 'select'
      ? {
          id: blank.id,
          kind,
          ui: 'dropdown',
          options: [
            { id: 'o1', text: '' },
            { id: 'o2', text: '' },
          ],
        }
      : { id: blank.id, kind, max_length: 50 }
  const blanks = content.value.blanks.map((b, i) => (i === index ? next : b))
  patchBoth({ blanks }, { blanks: { ...key.value.blanks, [blank.id]: emptyBlankKey(kind) } })
}

const patchKeyOf = (id, patch) =>
  patchBoth({}, { blanks: { ...key.value.blanks, [id]: { ...blankKey(id), ...patch } } })

function setOptionText(index, optIndex, text) {
  const options = content.value.blanks[index].options.map((o, i) =>
    i === optIndex ? { ...o, text } : o,
  )
  patchBlank(index, { options })
}

function addOption(index) {
  const options = content.value.blanks[index].options
  patchBlank(index, { options: [...options, { id: nextId('o', options), text: '' }] })
}

function removeOption(index, optIndex) {
  const blank = content.value.blanks[index]
  const removed = blank.options[optIndex].id
  patchBlank(index, { options: blank.options.filter((_, i) => i !== optIndex) })
  if (blankKey(blank.id).correct === removed) patchKeyOf(blank.id, { correct: null })
}
</script>

<template>
  <div class="form-stack">
    <PromptField
      :model-value="content.prompt"
      label="Instruksi"
      :error="errorAt('content.prompt')"
      :upload-image="uploadImage"
      min-height="4rem"
      @update:model-value="(prompt) => patchContent({ prompt })"
    />
    <div class="form-field">
      <div class="element-list__header">
        <span class="form-field__label"
          >Teks dengan rumpang<span class="form-field__required">*</span></span
        >
        <Button
          label="Sisipkan rumpang"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          outlined
          @click="insertBlank"
        />
      </div>
      <RichTextEditor
        ref="templateEditor"
        :model-value="content.template"
        placeholder="Tulis teks; sisipkan rumpang di posisi yang harus diisi siswa"
        :upload-image="uploadImage"
        min-height="6rem"
        @update:model-value="onTemplate"
      />
      <small class="form-field__hint"
        >Rumpang ditulis sebagai <code v-pre>{{ b1 }}</code
        >, <code v-pre>{{ b2 }}</code
        >, … tepat satu kali masing-masing.</small
      >
      <small v-if="errorAt('content.template')" class="form-field__error">{{
        errorAt('content.template')
      }}</small>
    </div>

    <Message v-if="!content.blanks.length" severity="warn" :closable="false"
      >Belum ada rumpang di teks.</Message
    >

    <div v-for="(blank, index) in content.blanks" :key="blank.id" class="blank-card">
      <div class="blank-card__header">
        <code class="blank-card__id" v-text="blankLabel(blank.id)" />
        <SelectButton
          :model-value="blank.kind"
          :options="KINDS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          size="small"
          :aria-label="`Jenis rumpang ${blank.id}`"
          @update:model-value="(kind) => setKind(index, kind)"
        />
        <SelectButton
          v-if="blank.kind === 'select'"
          :model-value="blank.ui ?? 'dropdown'"
          :options="UIS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          size="small"
          :aria-label="`Tampilan rumpang ${blank.id}`"
          @update:model-value="(ui) => patchBlank(index, { ui })"
        />
      </div>

      <template v-if="blank.kind === 'text'">
        <div class="form-field">
          <span class="form-field__label">Jawaban yang diterima</span>
          <TagInput
            :model-value="blankKey(blank.id).accepted ?? []"
            placeholder="Ketik jawaban lalu Enter"
            :invalid="!!errorAt(`answer_key.blanks.${blank.id}`)"
            @update:model-value="(accepted) => patchKeyOf(blank.id, { accepted })"
          />
        </div>
        <div class="toolbar">
          <MatchRulesEditor
            :model-value="blankKey(blank.id).match"
            @update:model-value="(match) => patchKeyOf(blank.id, { match })"
          />
          <div class="form-field">
            <label class="form-field__label" :for="`blank-max-${blank.id}`">Panjang maksimal</label>
            <InputNumber
              :input-id="`blank-max-${blank.id}`"
              :model-value="blank.max_length ?? null"
              :min="1"
              :max="200"
              :use-grouping="false"
              show-buttons
              @update:model-value="(v) => patchBlank(index, { max_length: v ?? 0 })"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <span class="form-field__label">Pilihan — tandai yang benar</span>
        <div v-for="(option, optIndex) in blank.options" :key="option.id" class="category-row">
          <RadioButton
            :model-value="blankKey(blank.id).correct"
            :value="option.id"
            :aria-label="`Benar ${blank.id} ${option.id}`"
            @update:model-value="(correct) => patchKeyOf(blank.id, { correct })"
          />
          <InputText
            :model-value="option.text"
            :placeholder="`Pilihan ${optIndex + 1}`"
            :aria-label="`Pilihan ${optIndex + 1} rumpang ${blank.id}`"
            fluid
            @update:model-value="(text) => setOptionText(index, optIndex, text)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :disabled="blank.options.length <= 2"
            :aria-label="`Hapus pilihan ${optIndex + 1}`"
            @click="removeOption(index, optIndex)"
          />
        </div>
        <div>
          <Button
            label="Tambah pilihan"
            icon="pi pi-plus"
            size="small"
            text
            :disabled="blank.options.length >= 10"
            @click="addOption(index)"
          />
        </div>
      </template>
      <small v-if="errorAt(`content.blanks[${index}]`)" class="form-field__error">{{
        errorAt(`content.blanks[${index}]`)
      }}</small>
      <small v-if="errorAt(`answer_key.blanks.${blank.id}`)" class="form-field__error">{{
        errorAt(`answer_key.blanks.${blank.id}`)
      }}</small>
    </div>
    <small v-if="errorAt('content.blanks')" class="form-field__error">{{
      errorAt('content.blanks')
    }}</small>
    <small v-if="errorAt('answer_key.blanks')" class="form-field__error">{{
      errorAt('answer_key.blanks')
    }}</small>
  </div>
</template>
