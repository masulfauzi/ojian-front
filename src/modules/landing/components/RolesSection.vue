<script setup>
import { defineAsyncComponent } from 'vue'
import SectionHeading from './SectionHeading.vue'

// Kerangka bagian sinkron (id & judul untuk tautan jangkar); Tabs dimuat terpisah.
const RoleTabs = defineAsyncComponent(() => import('./RoleTabs.vue'))
</script>

<template>
  <section id="peran" class="landing-section landing-section--alt" aria-labelledby="peran-judul">
    <div class="landing-container">
      <SectionHeading
        id="peran-judul"
        eyebrow="Peran"
        title="Setiap peran melihat yang ia butuhkan"
        lead="Menu dan hak akses mengikuti peran aktif. Sekolah juga dapat membuat peran kustom."
      />
      <div class="landing-lazy landing-lazy--roles"><RoleTabs /></div>
    </div>
  </section>
</template>
