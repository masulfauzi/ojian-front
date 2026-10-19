<script setup>
// Judul bagian (h2) + deskripsi. tabindex -1 agar fokus bisa dipindahkan saat tautan jangkar dibuka.
defineProps({
  id: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  lead: { type: String, default: '' },
})
</script>

<template>
  <div class="landing-heading">
    <span v-if="eyebrow" class="landing-eyebrow">{{ eyebrow }}</span>
    <h2 :id="id" class="landing-heading__title" tabindex="-1">{{ title }}</h2>
    <p v-if="lead" class="landing-heading__lead">{{ lead }}</p>
  </div>
</template>
