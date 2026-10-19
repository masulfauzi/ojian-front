<script setup>
import { defineAsyncComponent } from 'vue'
import SectionHeading from './SectionHeading.vue'

// Kerangka bagian sinkron (id & judul untuk tautan jangkar); Accordion dimuat terpisah.
const FaqList = defineAsyncComponent(() => import('./FaqList.vue'))
</script>

<template>
  <section id="faq" class="landing-section landing-section--alt" aria-labelledby="faq-judul">
    <div class="landing-container landing-container--narrow">
      <SectionHeading id="faq-judul" eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
      <div class="landing-lazy landing-lazy--faq"><FaqList /></div>
    </div>
  </section>
</template>
