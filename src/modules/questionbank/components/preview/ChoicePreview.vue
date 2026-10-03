<script setup>
import { computed } from 'vue'
import QuestionHtml from '../QuestionHtml.vue'

// single_choice → answer { selected: id }; multiple_choice → answer { selected: [id] }.
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  multiple: { type: Boolean, default: false },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const LETTERS = 'ABCDEFGHIJ'
const selected = computed(() => answer.value?.selected ?? (props.multiple ? [] : null))
const isSelected = (id) => (props.multiple ? selected.value.includes(id) : selected.value === id)

function choose(id) {
  if (props.disabled) return
  if (!props.multiple) return (answer.value = { selected: id })
  const current = selected.value
  const max = props.content.max_select || Infinity
  if (current.includes(id)) answer.value = { selected: current.filter((s) => s !== id) }
  else if (current.length < max) answer.value = { selected: [...current, id] }
}
</script>

<template>
  <div class="choice-list" :role="multiple ? 'group' : 'radiogroup'">
    <p v-if="multiple && content.max_select" class="text-muted choice-hint">
      Pilih
      {{
        content.min_select && content.min_select !== content.max_select
          ? `${content.min_select}–`
          : ''
      }}{{ content.max_select }} jawaban.
    </p>
    <button
      v-for="(option, index) in content.options"
      :key="option.id"
      type="button"
      class="choice"
      :class="{ 'is-selected': isSelected(option.id) }"
      :role="multiple ? 'checkbox' : 'radio'"
      :aria-checked="isSelected(option.id)"
      :disabled="disabled"
      @click="choose(option.id)"
    >
      <span class="choice__marker" :class="{ 'is-square': multiple }">{{ LETTERS[index] }}</span>
      <QuestionHtml :html="option.text" :school-id="schoolId" class="choice__text" />
    </button>
  </div>
</template>
