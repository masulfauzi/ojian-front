<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'
import QuestionHtml from '../QuestionHtml.vue'

// matching → answer { pairs: { [leftId]: rightId } }
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const pairs = computed(() => answer.value?.pairs ?? {})
const used = computed(() => new Set(Object.values(pairs.value)))
// Tanpa allow_reuse, item kanan yang sudah dipakai tidak bisa dipilih untuk baris lain.
const optionsFor = (leftId) =>
  props.content.right.map((r, i) => ({
    ...r,
    label: `${String.fromCharCode(65 + i)}`,
    disabled: !props.content.allow_reuse && used.value.has(r.id) && pairs.value[leftId] !== r.id,
  }))

function set(leftId, rightId) {
  const next = { ...pairs.value }
  if (rightId) next[leftId] = rightId
  else delete next[leftId]
  answer.value = { pairs: next }
}
</script>

<template>
  <div class="matching-preview">
    <div class="matching-preview__right">
      <div v-for="(right, index) in content.right" :key="right.id" class="matching-preview__ref">
        <strong>{{ String.fromCharCode(65 + index) }}.</strong>
        <QuestionHtml :html="right.text" :school-id="schoolId" />
      </div>
    </div>
    <div v-for="left in content.left" :key="left.id" class="matching-preview__row">
      <QuestionHtml :html="left.text" :school-id="schoolId" class="matching-preview__left" />
      <Select
        :model-value="pairs[left.id] ?? null"
        :options="optionsFor(left.id)"
        option-label="label"
        option-value="id"
        option-disabled="disabled"
        placeholder="Pilih"
        :disabled="disabled"
        show-clear
        class="matching-pair"
        :aria-label="`Pasangan untuk ${left.id}`"
        @update:model-value="(v) => set(left.id, v)"
      />
    </div>
  </div>
</template>
