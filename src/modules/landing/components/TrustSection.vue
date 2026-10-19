<script setup>
import { TRUST_POINTS } from '../data/trust'
import SectionHeading from './SectionHeading.vue'
</script>

<template>
  <section id="keamanan" class="landing-section" aria-labelledby="keamanan-judul">
    <div class="landing-container">
      <SectionHeading
        id="keamanan-judul"
        eyebrow="Keamanan dan kendali"
        title="Data sekolah tetap di tangan sekolah"
      />
      <ul class="trust-grid plain-list">
        <li v-for="point in TRUST_POINTS" :key="point.id" class="trust-item" data-reveal>
          <i :class="[point.icon, 'trust-item__icon']" aria-hidden="true" />
          <div>
            <h3 class="trust-item__title">{{ point.title }}</h3>
            <p class="trust-item__summary">{{ point.summary }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
