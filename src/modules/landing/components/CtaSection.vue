<script setup>
import { appName } from '../data/config'
import CtaButton from './CtaButton.vue'
</script>

<template>
  <section class="landing-section landing-cta" aria-labelledby="cta-judul">
    <div class="landing-container landing-container--narrow landing-cta__inner" data-reveal>
      <h2 id="cta-judul" class="landing-cta__title">Siap memakai {{ appName() }}?</h2>
      <p class="landing-cta__lead">
        Masuk dengan akun dari sekolah Anda: siswa dengan NISN, guru dengan nama pengguna, dan admin
        dengan email.
      </p>
      <CtaButton size="large" />
      <p class="landing-cta__register">
        Sekolah Anda belum terdaftar?
        <RouterLink :to="{ name: 'register-school' }">Daftarkan sekolah</RouterLink>
      </p>
    </div>
  </section>
</template>
