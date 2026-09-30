<script setup>
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { roleLabel } from '@/shared/constants/roles'
import { formatDate } from '@/shared/utils/format'
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
            <dt>Email</dt>
            <dd>{{ auth.user?.email }}</dd>
            <dt>Role</dt>
            <dd><Tag :value="roleLabel(auth.role)" /></dd>
            <dt>Terdaftar sejak</dt>
            <dd>{{ formatDate(auth.user?.createdAt) }}</dd>
          </dl>
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
