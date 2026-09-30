<script setup>
defineProps({
  /** Item menu yang sudah difilter berdasarkan role: { label, icon, to } */
  items: { type: Array, required: true },
})
</script>

<template>
  <nav class="sidebar-nav">
    <RouterLink
      v-for="item in items"
      :key="item.label"
      :to="item.to"
      class="sidebar-nav__link"
      active-class="is-active"
    >
      <i :class="item.icon" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
