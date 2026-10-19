<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import { useAuthStore } from '@/modules/auth'

// CTA landing: "Masuk" untuk tamu (dan selama sesi belum selesai dimuat), "Buka Dashboard" bila
// sudah login. Landing tidak mengalihkan pengguna yang sudah login.
defineProps({
  size: { type: String, default: undefined },
  outlined: { type: Boolean, default: false },
})

const auth = useAuthStore()
const loggedIn = computed(() => auth.initialized && auth.isAuthenticated)
</script>

<template>
  <Button
    as="router-link"
    :to="loggedIn ? { name: 'dashboard' } : { name: 'login' }"
    :label="loggedIn ? 'Buka Dashboard' : 'Masuk'"
    :icon="loggedIn ? 'pi pi-th-large' : 'pi pi-sign-in'"
    :size="size"
    :outlined="outlined"
    data-cta
  />
</template>
