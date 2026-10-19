<script setup>
import Button from 'primevue/button'
import { contactEmail, mailtoLink, whatsappLink } from '../data/config'
import SectionHeading from './SectionHeading.vue'

// Hanya dirender oleh halaman bila ada env kontak. Tanpa formulir.
const email = contactEmail()
const mailto = mailtoLink()
const whatsapp = whatsappLink()
</script>

<template>
  <section id="kontak" class="landing-section" aria-labelledby="kontak-judul">
    <div class="landing-container landing-container--narrow landing-contact">
      <SectionHeading
        id="kontak-judul"
        eyebrow="Kontak"
        title="Ingin tahu lebih lanjut?"
        lead="Hubungi kami untuk informasi penggunaan di sekolah Anda."
      />
      <div class="landing-contact__actions">
        <Button
          v-if="mailto"
          as="a"
          :href="mailto"
          :label="email"
          icon="pi pi-envelope"
          severity="secondary"
          outlined
          data-contact="email"
        />
        <Button
          v-if="whatsapp"
          as="a"
          :href="whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          label="WhatsApp"
          icon="pi pi-whatsapp"
          severity="secondary"
          outlined
          data-contact="whatsapp"
        />
      </div>
    </div>
  </section>
</template>
