<script setup>
import RadioButton from 'primevue/radiobutton'
import QuestionHtml from '../QuestionHtml.vue'

// true_false_group → answer { values: { [statementId]: boolean } }
const answer = defineModel('answer', { type: Object, default: null })
defineProps({
  content: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const set = (id, value) =>
  (answer.value = { values: { ...(answer.value?.values ?? {}), [id]: value } })
</script>

<template>
  <table class="tfg-table">
    <thead>
      <tr>
        <th>Pernyataan</th>
        <th>{{ content.labels?.true || 'Benar' }}</th>
        <th>{{ content.labels?.false || 'Salah' }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="statement in content.statements" :key="statement.id">
        <td><QuestionHtml :html="statement.text" :school-id="schoolId" /></td>
        <td v-for="value in [true, false]" :key="String(value)" class="tfg-table__choice">
          <RadioButton
            :model-value="answer?.values?.[statement.id]"
            :value="value"
            :disabled="disabled"
            :aria-label="`${value ? 'Benar' : 'Salah'}: pernyataan ${statement.id}`"
            @update:model-value="(v) => set(statement.id, v)"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
