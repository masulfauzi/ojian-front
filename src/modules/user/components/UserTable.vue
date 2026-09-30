<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusTag from '@/shared/components/StatusTag.vue'
import { formatDateTime } from '@/shared/utils/format'

defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  totalRecords: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  rows: { type: Number, default: 10 },
  /** ID user yang sedang login: tombol hapus dinonaktifkan untuk akun ini. */
  currentUserId: { type: String, default: null },
  /** (user) => nama sekolah; null = kolom sekolah disembunyikan. */
  schoolName: { type: Function, default: null },
  canUpdate: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
})

const emit = defineEmits(['page', 'edit', 'delete'])
</script>

<template>
  <DataTable
    :value="users"
    :loading="loading"
    :total-records="totalRecords"
    :rows="rows"
    :first="(page - 1) * rows"
    data-key="id"
    lazy
    paginator
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    current-page-report-template="{first}–{last} dari {totalRecords} pengguna"
    striped-rows
    @page="emit('page', $event.page + 1)"
  >
    <template #empty>
      <EmptyState
        icon="pi pi-users"
        title="Belum ada pengguna"
        description="Tidak ada pengguna yang cocok dengan pencarian atau filter."
      />
    </template>

    <Column header="Pengguna">
      <template #body="{ data }">
        <div class="cell-stack">
          <span class="cell-stack__title">{{ data.name }}</span>
          <span class="text-muted"
            >{{ data.username }}<template v-if="data.email"> · {{ data.email }}</template></span
          >
        </div>
      </template>
    </Column>
    <Column v-if="schoolName" header="Sekolah">
      <template #body="{ data }">
        <span v-if="data.schoolId">{{ schoolName(data) }}</span>
        <Tag v-else value="Platform" severity="contrast" />
      </template>
    </Column>
    <Column header="Role">
      <template #body="{ data }">
        <div class="tag-list">
          <Tag
            v-for="role in data.roles"
            :key="role.id"
            :value="role.name"
            :severity="role.isDefault ? 'info' : 'secondary'"
            :icon="role.isDefault ? 'pi pi-star-fill' : undefined"
          />
        </div>
      </template>
    </Column>
    <Column header="Status">
      <template #body="{ data }">
        <div class="tag-list">
          <StatusTag :active="data.isActive" />
          <Tag
            v-if="data.mustChangePassword"
            v-tooltip.top="'Belum mengganti password awal'"
            value="Password awal"
            severity="warn"
            icon="pi pi-key"
          />
        </div>
      </template>
    </Column>
    <Column header="Login terakhir">
      <template #body="{ data }">
        <span class="text-muted">{{
          data.lastLoginAt ? formatDateTime(data.lastLoginAt) : 'Belum pernah'
        }}</span>
      </template>
    </Column>
    <Column v-if="canUpdate || canDelete" header="Aksi">
      <template #body="{ data }">
        <div class="row-actions">
          <Button
            v-if="canUpdate"
            v-tooltip.top="'Ubah'"
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            :aria-label="`Ubah ${data.name}`"
            @click="emit('edit', data)"
          />
          <span
            v-if="canDelete"
            v-tooltip.top="
              data.id === currentUserId ? 'Tidak dapat menghapus akun sendiri' : 'Hapus'
            "
          >
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="data.id === currentUserId"
              :aria-label="`Hapus ${data.name}`"
              @click="emit('delete', data)"
            />
          </span>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
