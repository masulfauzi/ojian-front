<script setup>
defineProps({
  /** Item dari useMenu(): halaman { key, label, icon, to } atau grup { key, label, children }. */
  items: { type: Array, required: true },
})
</script>

<template>
  <nav class="sidebar-nav">
    <template v-for="item in items" :key="item.key">
      <div v-if="item.children" class="sidebar-nav__group">
        <div class="sidebar-nav__group-label">{{ item.label }}</div>
        <RouterLink
          v-for="child in item.children"
          :key="child.key"
          :to="child.to"
          class="sidebar-nav__link"
          active-class="is-active"
        >
          <i :class="child.icon" aria-hidden="true" />
          <span>{{ child.label }}</span>
        </RouterLink>
      </div>
      <RouterLink v-else :to="item.to" class="sidebar-nav__link" active-class="is-active">
        <i :class="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </template>
  </nav>
</template>
