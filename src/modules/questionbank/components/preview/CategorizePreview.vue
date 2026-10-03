<script setup>
import { computed } from 'vue'
import SortableList from '@/shared/components/SortableList.vue'
import QuestionHtml from '../QuestionHtml.vue'

// categorize → answer { placement: { [itemId]: categoryId } }; seret item ke kotak kategori.
const answer = defineModel('answer', { type: Object, default: null })
const props = defineProps({
  content: { type: Object, required: true },
  schoolId: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const placement = computed(() => answer.value?.placement ?? {})
const itemsIn = (catId) =>
  props.content.items.filter((item) => (placement.value[item.id] ?? null) === catId)

function setList(catId, list) {
  const next = { ...placement.value }
  for (const item of list) {
    if (catId) next[item.id] = catId
    else delete next[item.id]
  }
  answer.value = { placement: next }
}

const GROUP = 'categorize-items'
</script>

<template>
  <div class="categorize-preview">
    <div class="categorize-preview__pool">
      <span class="text-muted">Item (seret ke kategori)</span>
      <SortableList
        :model-value="itemsIn(null)"
        :group="GROUP"
        :disabled="disabled"
        class="categorize-preview__list"
        @update:model-value="(list) => setList(null, list)"
      >
        <template #item="{ item }">
          <QuestionHtml :html="item.text" :school-id="schoolId" class="categorize-preview__item" />
        </template>
      </SortableList>
    </div>
    <div class="categorize-preview__categories">
      <div v-for="cat in content.categories" :key="cat.id" class="categorize-preview__category">
        <strong>{{ cat.label }}</strong>
        <SortableList
          :model-value="itemsIn(cat.id)"
          :group="GROUP"
          :disabled="disabled"
          class="categorize-preview__list"
          @update:model-value="(list) => setList(cat.id, list)"
        >
          <template #item="{ item }">
            <QuestionHtml
              :html="item.text"
              :school-id="schoolId"
              class="categorize-preview__item"
            />
          </template>
        </SortableList>
      </div>
    </div>
  </div>
</template>
