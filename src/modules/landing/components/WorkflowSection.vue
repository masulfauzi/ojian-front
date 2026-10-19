<script setup>
import { defineAsyncComponent } from 'vue'
import SectionHeading from './SectionHeading.vue'

// Kerangka bagian sinkron (id & judul untuk tautan jangkar); Tabs dimuat terpisah.
const WorkflowTabs = defineAsyncComponent(() => import('./WorkflowTabs.vue'))
</script>

<template>
  <section id="alur" class="landing-section" aria-labelledby="alur-judul">
    <div class="landing-container">
      <SectionHeading
        id="alur-judul"
        eyebrow="Alur kerja"
        title="Dari persiapan sampai laporan"
        lead="Tiga alur yang paling sering dipakai sekolah setiap hari."
      />
      <div class="landing-lazy landing-lazy--workflow"><WorkflowTabs /></div>
    </div>
  </section>
</template>
