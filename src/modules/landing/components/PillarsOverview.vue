<script setup>
import { PILLARS } from '../data/pillars'
</script>

<template>
  <section class="landing-section landing-section--tight" aria-labelledby="pilar-judul">
    <div class="landing-container">
      <h2 id="pilar-judul" class="visually-hidden">Enam pilar platform</h2>
      <ul class="pillar-grid plain-list">
        <li v-for="pillar in PILLARS" :key="pillar.id" data-reveal>
          <RouterLink :to="{ name: 'landing', hash: `#pilar-${pillar.id}` }" class="pillar-card">
            <i :class="[pillar.icon, 'pillar-card__icon']" aria-hidden="true" />
            <span class="pillar-card__title">{{ pillar.title }}</span>
            <span class="pillar-card__tagline">{{ pillar.tagline }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
