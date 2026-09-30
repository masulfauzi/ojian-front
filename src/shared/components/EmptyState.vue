<script setup>
defineProps({
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, default: 'Tidak ada data' },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="empty-state">
    <i :class="['empty-state__icon', icon]" aria-hidden="true" />
    <h2 class="empty-state__title">{{ title }}</h2>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>
