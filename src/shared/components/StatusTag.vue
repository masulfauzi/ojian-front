<script setup>
import Tag from 'primevue/tag'

defineProps({
  active: { type: Boolean, default: false },
  activeLabel: { type: String, default: 'Aktif' },
  inactiveLabel: { type: String, default: 'Nonaktif' },
})
</script>

<template>
  <Tag
    :value="active ? activeLabel : inactiveLabel"
    :severity="active ? 'success' : 'secondary'"
    :icon="active ? 'pi pi-check' : 'pi pi-ban'"
  />
</template>
