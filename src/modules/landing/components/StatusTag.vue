<script setup>
import Tag from 'primevue/tag'

// Label untuk fitur yang belum tersedia. Fitur `available` tidak diberi label.
defineProps({
  status: { type: String, required: true },
})
</script>

<template>
  <Tag
    v-if="status === 'coming_soon'"
    value="Segera hadir"
    severity="secondary"
    class="landing-soon"
  />
</template>
