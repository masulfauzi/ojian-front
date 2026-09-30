<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useAuthStore, roleLabel } from '@/modules/auth'

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
          Anda masuk sebagai <Tag :value="roleLabel(auth.role)" />. Gunakan menu di samping untuk
          mulai bekerja.
        </p>
      </template>
    </Card>
  </div>
</template>
