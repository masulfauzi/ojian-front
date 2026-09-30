<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useAuthStore } from '@/modules/auth'

const auth = useAuthStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
})
</script>

<template>
  <div class="page">
    <PageHeader title="Dashboard" />
    <Card>
      <template #content>
        <h2>{{ greeting }}, {{ auth.user?.name }}!</h2>
        <p class="text-muted">
          Anda masuk sebagai <Tag :value="auth.activeRole?.name" />
          <template v-if="auth.user?.school">
            di <strong>{{ auth.user.school.name }}</strong
            >.
          </template>
          <template v-else> di tingkat platform.</template>
          Gunakan menu di samping untuk mulai bekerja.
        </p>
        <p v-if="auth.hasMultipleRoles" class="text-muted">
          Anda punya {{ auth.roles.length }} role. Ganti role aktif lewat pilihan di kanan atas.
        </p>
      </template>
    </Card>
  </div>
</template>
