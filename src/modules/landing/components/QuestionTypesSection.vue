<script setup>
import { QUESTION_TYPES } from '../data/questionTypes'
import SectionHeading from './SectionHeading.vue'
import StatusTag from './StatusTag.vue'
</script>

<template>
  <section
    id="jenis-soal"
    class="landing-section landing-section--alt"
    aria-labelledby="jenis-soal-judul"
  >
    <div class="landing-container">
      <SectionHeading
        id="jenis-soal-judul"
        eyebrow="Jenis soal"
        title="Soal yang sesuai cara menilai di kelas"
        lead="Setiap jenis punya cara menilai sendiri, termasuk nilai parsial bila sebagian jawaban benar."
      />
      <ul class="qtype-grid plain-list">
        <li
          v-for="item in QUESTION_TYPES"
          :key="item.id"
          class="qtype-card"
          :class="{ 'is-soon': item.status === 'coming_soon' }"
          :data-qtype="item.id"
          data-reveal
        >
          <i :class="[item.icon, 'qtype-card__icon']" aria-hidden="true" />
          <h3 class="qtype-card__title">{{ item.title }}</h3>
          <p class="qtype-card__summary">{{ item.summary }}</p>
          <StatusTag :status="item.status" />
        </li>
      </ul>
    </div>
  </section>
</template>
