<script setup>
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import ChangePasswordForm from '../components/ChangePasswordForm.vue'
import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const notify = useNotify()

async function handleChangePassword(payload) {
  await auth.changePassword(payload)
  notify.success('Password berhasil diubah')
}
</script>

<template>
  <div class="page">
    <PageHeader title="Profil" description="Data akun dan keamanan" />

    <div class="grid-2">
      <Card>
        <template #title>Data akun</template>
        <template #content>
          <dl class="detail-list">
            <dt>Nama</dt>
            <dd>{{ auth.user?.name }}</dd>
            <dt>Username</dt>
            <dd>{{ auth.user?.username }}</dd>
            <dt>Email</dt>
            <dd>{{ auth.user?.email || '-' }}</dd>
            <dt>Sekolah</dt>
            <dd>
              <template v-if="auth.user?.school">
                {{ auth.user.school.name }}
                <span class="text-muted">({{ auth.user.school.code }})</span>
              </template>
              <Tag v-else value="Platform" severity="contrast" />
            </dd>
            <dt>Role</dt>
            <dd class="tag-list">
              <Tag
                v-for="role in auth.roles"
                :key="role.id"
                :value="role.name"
                :severity="role.id === auth.activeRole?.id ? 'success' : 'secondary'"
                :icon="role.isDefault ? 'pi pi-star-fill' : undefined"
              />
            </dd>
            <dt>Login terakhir</dt>
            <dd>{{ formatDateTime(auth.user?.lastLoginAt) }}</dd>
            <dt>Terdaftar sejak</dt>
            <dd>{{ formatDate(auth.user?.createdAt) }}</dd>
          </dl>
          <p class="text-muted" style="margin-bottom: 0">
            <i class="pi pi-star-fill" aria-hidden="true" /> role default · hijau = role aktif
          </p>
        </template>
      </Card>

      <Card>
        <template #title>Ganti password</template>
        <template #content>
          <ChangePasswordForm :submit="handleChangePassword" />
        </template>
      </Card>
    </div>
  </div>
</template>
