<script setup>
import { useRoute, useRouter } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import { useAuthStore } from '../stores/auth.store'

const appName = import.meta.env.VITE_APP_NAME || 'Exam Web'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

/** Hanya izinkan redirect ke path internal agar tidak bisa dipakai untuk open redirect. */
function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : auth.homeRoute()
}

async function handleLogin(credentials) {
  await auth.login(credentials)
  // Guard akan mengalihkan ke /change-password bila password awal belum diganti.
  await router.replace(safeRedirect(route.query.redirect))
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-card__header">
      <i class="pi pi-book auth-card__logo" aria-hidden="true" />
      <h1 class="auth-card__title">{{ appName }}</h1>
      <p class="auth-card__subtitle">Masuk untuk melanjutkan</p>
    </div>
    <LoginForm :submit="handleLogin" />
    <p class="auth-card__footer">
      Sekolah Anda belum terdaftar?
      <RouterLink :to="{ name: 'register-school' }">Daftarkan sekolah</RouterLink>
    </p>
  </div>
</template>
