<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="auth-layout">
    <!-- meta.wide: halaman publik dengan form panjang (mis. registrasi sekolah). -->
    <main class="auth-layout__content" :class="{ 'auth-layout__content--wide': route.meta.wide }">
      <RouterView />
    </main>
  </div>
</template>
