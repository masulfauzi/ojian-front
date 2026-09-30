<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusTag from '@/shared/components/StatusTag.vue'

defineProps({
  roles: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  totalRecords: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  rows: { type: Number, default: 10 },
  /** (role) => nama sekolah, untuk kolom cakupan role kustom. */
  schoolName: { type: Function, default: () => null },
  /** (role) => boolean */
  canEdit: { type: Function, default: () => false },
  canDelete: { type: Boolean, default: false },
})

const emit = defineEmits(['page', 'edit', 'permissions', 'delete'])
</script>

<template>
  <DataTable
    :value="roles"
    :loading="loading"
    :total-records="totalRecords"
    :rows="rows"
    :first="(page - 1) * rows"
    data-key="id"
    lazy
    paginator
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    current-page-report-template="{first}–{last} dari {totalRecords} role"
    striped-rows
    @page="emit('page', $event.page + 1)"
  >
    <template #empty>
      <EmptyState
        icon="pi pi-shield"
        title="Belum ada role"
        description="Tidak ada role yang cocok dengan pencarian atau filter."
      />
    </template>

    <Column header="Role">
      <template #body="{ data }">
        <div class="cell-stack">
          <span class="cell-stack__title">{{ data.name }}</span>
          <span v-if="data.description" class="text-muted">{{ data.description }}</span>
        </div>
      </template>
    </Column>
    <Column header="Kode">
      <template #body="{ data }"
        ><code>{{ data.code }}</code></template
      >
    </Column>
    <Column header="Cakupan">
      <template #body="{ data }">
        <Tag v-if="data.isSystem" value="Sistem" severity="contrast" icon="pi pi-lock" />
        <span v-else>{{ schoolName(data) ?? 'Sekolah' }}</span>
      </template>
    </Column>
    <Column header="Status">
      <template #body="{ data }"><StatusTag :active="data.isActive" /></template>
    </Column>
    <Column header="Aksi">
      <template #body="{ data }">
        <div class="row-actions">
          <Button
            v-tooltip.top="'Hak akses'"
            icon="pi pi-key"
            severity="secondary"
            text
            rounded
            :aria-label="`Hak akses ${data.name}`"
            @click="emit('permissions', data)"
          />
          <Button
            v-if="canEdit(data)"
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
            v-tooltip.top="data.isSystem ? 'Role sistem tidak dapat dihapus' : 'Hapus'"
          >
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="data.isSystem"
              :aria-label="`Hapus ${data.name}`"
              @click="emit('delete', data)"
            />
          </span>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
