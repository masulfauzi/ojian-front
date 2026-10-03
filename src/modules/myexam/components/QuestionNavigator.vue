<script setup>
// Panel nomor soal: terjawab / ragu-ragu / sedang dibuka / gagal tersimpan.
defineProps({
  /** [{ examQuestionId, number }] */
  questions: { type: Array, required: true },
  current: { type: Number, default: 0 },
  isAnswered: { type: Function, required: true },
  flags: { type: Object, required: true },
  saveState: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['select'])

const stateLabel = (answered, flagged) =>
  [answered ? 'terjawab' : 'belum dijawab', flagged ? 'ragu-ragu' : ''].filter(Boolean).join(', ')
</script>

<template>
  <nav class="question-nav" aria-label="Nomor soal">
    <ol class="question-nav__grid">
      <li v-for="(q, index) in questions" :key="q.examQuestionId">
        <button
          type="button"
          class="question-nav__item"
          :class="{
            'is-answered': isAnswered(q),
            'is-flagged': flags[q.examQuestionId],
            'is-current': index === current,
            'is-error': saveState[q.examQuestionId] === 'error',
          }"
          :aria-current="index === current ? 'step' : undefined"
          :aria-label="`Soal ${q.number}, ${stateLabel(isAnswered(q), flags[q.examQuestionId])}`"
          @click="emit('select', index)"
        >
          {{ q.number }}
        </button>
      </li>
    </ol>
    <ul class="question-nav__legend plain-list">
      <li><span class="legend-dot is-answered" /> Terjawab</li>
      <li><span class="legend-dot is-flagged" /> Ragu-ragu</li>
      <li><span class="legend-dot" /> Belum</li>
    </ul>
  </nav>
</template>
