<script setup>
import StatusTag from './StatusTag.vue'

// Satu pilar: judul (h3) dan daftar fiturnya.
defineProps({
  pillar: { type: Object, required: true },
})
</script>

<template>
  <article :id="`pilar-${pillar.id}`" class="feature-group" data-reveal>
    <header class="feature-group__header">
      <span class="feature-group__icon"><i :class="pillar.icon" aria-hidden="true" /></span>
      <div>
        <h3 class="feature-group__title" tabindex="-1">{{ pillar.title }}</h3>
        <p class="feature-group__tagline">{{ pillar.tagline }}</p>
      </div>
    </header>
    <ul class="feature-list plain-list">
      <li
        v-for="feature in pillar.features"
        :key="feature.id"
        class="feature-item"
        :data-feature="feature.id"
      >
        <div class="feature-item__head">
          <i class="pi pi-check feature-item__check" aria-hidden="true" />
          <h4 class="feature-item__title">{{ feature.title }}</h4>
          <StatusTag :status="feature.status" />
        </div>
        <p class="feature-item__summary">{{ feature.summary }}</p>
      </li>
    </ul>
  </article>
</template>
