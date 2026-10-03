<script setup>
import Card from 'primevue/card'
import QuestionHtml from '../QuestionHtml.vue'
import CategorizePreview from './CategorizePreview.vue'
import ChoicePreview from './ChoicePreview.vue'
import EssayPreview from './EssayPreview.vue'
import FillBlankPreview from './FillBlankPreview.vue'
import MatchingPreview from './MatchingPreview.vue'
import OrderingPreview from './OrderingPreview.vue'
import TextAnswerPreview from './TextAnswerPreview.vue'
import TrueFalseGroupPreview from './TrueFalseGroupPreview.vue'
import TrueFalsePreview from './TrueFalsePreview.vue'

/**
 * Soal seperti yang dilihat siswa (content dari server: sudah teracak, tanpa kunci).
 * `answer` memakai format jawaban backend sehingga komponen ini bisa dipakai di halaman ujian.
 */
const answer = defineModel('answer', { type: Object, default: null })
defineProps({
  /** { type, content, stimulus? } — hasil toStudentQuestion. */
  question: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const COMPONENTS = {
  single_choice: { is: ChoicePreview },
  multiple_choice: { is: ChoicePreview, props: { multiple: true } },
  true_false: { is: TrueFalsePreview },
  true_false_group: { is: TrueFalseGroupPreview },
  matching: { is: MatchingPreview },
  ordering: { is: OrderingPreview },
  categorize: { is: CategorizePreview },
  short_answer: { is: TextAnswerPreview },
  numeric: { is: TextAnswerPreview, props: { numeric: true } },
  fill_blank: { is: FillBlankPreview },
  essay: { is: EssayPreview },
}
</script>

<template>
  <div class="question-preview">
    <Card v-if="question.stimulus" class="question-preview__stimulus">
      <template #title>{{ question.stimulus.title }}</template>
      <template #content>
        <QuestionHtml :html="question.stimulus.body" :school-id="schoolId" />
      </template>
    </Card>
    <QuestionHtml
      :html="question.content.prompt"
      :school-id="schoolId"
      class="question-preview__prompt"
    />
    <component
      :is="COMPONENTS[question.type].is"
      v-if="COMPONENTS[question.type]"
      v-model:answer="answer"
      :content="question.content"
      :school-id="schoolId"
      :disabled="disabled"
      v-bind="COMPONENTS[question.type].props"
    />
    <p v-else class="text-muted">Jenis soal "{{ question.type }}" belum didukung pratinjau.</p>
  </div>
</template>
