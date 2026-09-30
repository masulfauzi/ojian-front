<script setup>
import Button from 'primevue/button'
import EmptyState from '@/shared/components/EmptyState.vue'
</script>

<template>
  <div class="center-page">
    <EmptyState
      icon="pi pi-lock"
      title="403 · Akses ditolak"
      description="Anda tidak memiliki izin untuk membuka halaman ini."
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
