<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import { ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER, roleLabel } from '@/modules/auth'

defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  totalRecords: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  rows: { type: Number, default: 10 },
  /** ID user yang sedang login: tombol hapus dinonaktifkan untuk akun ini. */
  currentUserId: { type: String, default: null },
})

const emit = defineEmits(['page', 'edit', 'delete'])

const ROLE_SEVERITY = {
  [ROLE_ADMIN]: 'danger',
  [ROLE_TEACHER]: 'info',
  [ROLE_STUDENT]: 'success',
}
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
    current-page-report-template="{first}–{last} dari {totalRecords} user"
    striped-rows
    @page="emit('page', $event.page + 1)"
  >
    <template #empty>
      <EmptyState
        icon="pi pi-users"
        title="Belum ada user"
        description="Tidak ada user yang cocok dengan pencarian atau filter."
      />
    </template>

    <Column field="name" header="Nama" />
    <Column field="email" header="Email" />
    <Column header="Role">
      <template #body="{ data }">
        <Tag :value="roleLabel(data.role)" :severity="ROLE_SEVERITY[data.role]" />
      </template>
    </Column>
    <Column header="Status">
      <template #body="{ data }">
        <Tag
          :value="data.isActive ? 'Aktif' : 'Nonaktif'"
          :severity="data.isActive ? 'success' : 'secondary'"
          :icon="data.isActive ? 'pi pi-check' : 'pi pi-ban'"
        />
      </template>
    </Column>
    <Column header="Aksi" :style="{ width: '7rem' }">
      <template #body="{ data }">
        <div class="toolbar">
          <Button
            v-tooltip.top="'Ubah'"
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            :aria-label="`Ubah ${data.name}`"
            @click="emit('edit', data)"
          />
          <span
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
