<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useNotify } from '@/shared/composables/useNotify'
import ChangePasswordForm from '../components/ChangePasswordForm.vue'
import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const router = useRouter()
const notify = useNotify()

async function handleChangePassword(payload) {
  await auth.changePassword(payload)
  notify.success('Password berhasil diubah')
  await router.replace(auth.homeRoute())
}

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-card__header">
      <i class="pi pi-lock auth-card__logo" aria-hidden="true" />
      <h1 class="auth-card__title">Ganti password</h1>
      <p class="auth-card__subtitle">Halo, {{ auth.user?.name }}</p>
    </div>
    <div class="form-stack">
      <Message v-if="auth.mustChangePassword" severity="warn" :closable="false">
        Akun Anda masih memakai password awal dari admin. Ganti password sebelum melanjutkan.
      </Message>
      <ChangePasswordForm :submit="handleChangePassword" />
      <Button label="Keluar" icon="pi pi-sign-out" severity="secondary" text @click="logout" />
    </div>
  </div>
</template>
