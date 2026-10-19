<script setup>
import Button from 'primevue/button'
import CtaButton from './CtaButton.vue'
import HeroMockup from './HeroMockup.vue'
</script>

<template>
  <section class="landing-hero" aria-labelledby="hero-title">
    <div class="landing-container landing-hero__inner">
      <div class="landing-hero__text">
        <span class="landing-eyebrow">Platform sekolah terpadu</span>
        <h1 id="hero-title" class="landing-hero__title">
          Ujian online, presensi, dan jurnal mengajar dalam satu platform
        </h1>
        <p class="landing-hero__lead">
          Dirancang untuk sekolah di Indonesia: guru menyusun dan menjadwalkan ujian, siswa presensi
          lewat selfie dan mengajukan izin dari ponsel, dan laporan mengajar siap dicetak ke Excel.
        </p>
        <div class="landing-hero__actions">
          <CtaButton size="large" />
          <Button
            as="router-link"
            :to="{ name: 'landing', hash: '#fitur' }"
            label="Lihat fitur"
            icon="pi pi-arrow-down"
            size="large"
            severity="secondary"
            outlined
          />
        </div>
      </div>
      <HeroMockup />
    </div>
  </section>
</template>
