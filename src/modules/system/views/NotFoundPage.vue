<script setup>
import Button from 'primevue/button'
import EmptyState from '@/shared/components/EmptyState.vue'
</script>

<template>
  <div class="center-page">
    <EmptyState
      icon="pi pi-compass"
      title="404 · Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan."
    >
      <Button
        label="Kembali ke Dashboard"
        icon="pi pi-home"
        as="router-link"
        :to="{ name: 'dashboard' }"
      />
    </EmptyState>
  </div>
</template>
