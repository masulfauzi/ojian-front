<script setup>
import { computed } from 'vue'
import SortableList from '@/shared/components/SortableList.vue'
import QuestionHtml from '../QuestionHtml.vue'

// ordering → answer { order: [itemId] }; awalnya mengikuti urutan dari server (teracak).
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const items = computed({
  get: () => {
    const byId = new Map(props.content.items.map((item) => [item.id, item]))
    const order = answer.value?.order ?? props.content.items.map((item) => item.id)
    return order.map((id) => byId.get(id)).filter(Boolean)
  },
  set: (list) => (answer.value = { order: list.map((item) => item.id) }),
})
</script>

<template>
  <SortableList v-model="items" handle=".drag-handle" :disabled="disabled" class="ordering-preview">
    <template #item="{ item, index }">
      <div class="ordering-preview__item">
        <i class="pi pi-bars drag-handle" aria-label="Seret" />
        <span class="ordering-rank">{{ index + 1 }}</span>
        <QuestionHtml :html="item.text" :school-id="schoolId" />
      </div>
    </template>
  </SortableList>
</template>
