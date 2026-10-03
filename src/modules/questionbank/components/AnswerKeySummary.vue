<script setup>
import { computed } from 'vue'
import { typeOf } from '../types/definitions'
import QuestionHtml from './QuestionHtml.vue'

// Ringkasan kunci jawaban untuk guru (tidak pernah dikirim ke siswa).
const props = defineProps({
  typeCode: { type: String, required: true },
  content: { type: Object, required: true },
  answerKey: { type: Object, required: true },
  schoolId: { type: String, default: null },
})

const rows = computed(
  () => typeOf(props.typeCode)?.describeKey(props.content, props.answerKey ?? {}) ?? [],
)
</script>

<template>
  <dl class="key-summary">
    <template v-for="(row, index) in rows" :key="index">
      <dt><QuestionHtml :html="row.label" :school-id="schoolId" /></dt>
      <dd><QuestionHtml :html="row.html || '-'" :school-id="schoolId" /></dd>
    </template>
  </dl>
</template>
