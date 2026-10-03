<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { sanitizeRichText } from '@/shared/utils/sanitize'
import { resolveMediaHtml } from '../../composables/useMediaResolver'

// fill_blank → answer { blanks: { [blankId]: teks | optionId } }.
// Template dirender sebagai HTML; tiap {{id}} diganti titik tempel lalu input ditaruh lewat Teleport.
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const slotId = (blankId) => `blank-${uid}-${blankId}`.replace(/[^a-zA-Z0-9_-]/g, '_')

const html = ref('')
const version = ref(0)
// Input baru dipasang setelah HTML (berisi titik tempel) benar-benar ada di DOM.
const ready = ref(false)
watch(
  () => [props.content.template, props.schoolId],
  async ([template]) => {
    ready.value = false
    const withSlots = (template ?? '').replace(
      /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g,
      (_, id) => `<span class="blank-slot" id="${slotId(id)}"></span>`,
    )
    html.value = sanitizeRichText(await resolveMediaHtml(withSlots, { schoolId: props.schoolId }))
    version.value += 1
    await nextTick()
    ready.value = true
  },
  { immediate: true },
)

const values = computed(() => answer.value?.blanks ?? {})
const set = (id, value) => (answer.value = { blanks: { ...values.value, [id]: value } })

// Kata untuk rumpang bertampilan "seret kata": ditampilkan sebagai bank kata.
const wordBank = computed(() =>
  props.content.blanks
    .filter((b) => b.kind === 'select' && b.ui === 'drag')
    .flatMap((b) => b.options),
)
</script>

<template>
  <div class="fill-blank-preview">
    <div v-if="wordBank.length" class="word-bank">
      <span class="text-muted">Pilihan kata:</span>
      <span v-for="word in wordBank" :key="word.id" class="word-bank__word">{{ word.text }}</span>
    </div>
    <div :key="version" class="rich-text" v-html="html" />
    <template v-for="blank in ready ? content.blanks : []" :key="`${version}-${blank.id}`">
      <Teleport :to="`#${slotId(blank.id)}`" defer>
        <Select
          v-if="blank.kind === 'select'"
          :model-value="values[blank.id] ?? null"
          :options="blank.options"
          option-label="text"
          option-value="id"
          placeholder="…"
          :disabled="disabled"
          class="blank-input blank-input--select"
          :aria-label="`Rumpang ${blank.id}`"
          @update:model-value="(v) => set(blank.id, v)"
        />
        <InputText
          v-else
          :model-value="values[blank.id] ?? ''"
          :maxlength="blank.max_length || 200"
          :disabled="disabled"
          class="blank-input"
          :aria-label="`Rumpang ${blank.id}`"
          @update:model-value="(v) => set(blank.id, v)"
        />
      </Teleport>
    </template>
  </div>
</template>
