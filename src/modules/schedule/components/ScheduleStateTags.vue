<script setup>
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { scheduleStatusOf, timeStateOf } from '../constants'

// Status jadwal (draf/dipublikasikan/dibatalkan) + keadaan waktu bila dipublikasikan.
const props = defineProps({
  schedule: { type: Object, required: true },
})

const status = computed(() => scheduleStatusOf(props.schedule.status))
const time = computed(() =>
  props.schedule.status === 'published' ? timeStateOf(props.schedule.timeState) : null,
)
</script>

<template>
  <span class="tag-list">
    <Tag :value="status.label" :severity="status.severity" />
    <Tag v-if="time" :value="time.label" :severity="time.severity" :icon="time.icon" />
  </span>
</template>
