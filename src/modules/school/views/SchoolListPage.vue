<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { ACTIVE_STATUS_OPTIONS } from '@/shared/constants/status'
import { useAuthStore, useCan } from '@/modules/auth'
import SchoolFormDialog from '../components/SchoolFormDialog.vue'
import SchoolTable from '../components/SchoolTable.vue'
import { EDUCATION_LEVELS, EDUCATION_LEVEL_OPTIONS } from '../constants'
import { useSchoolStore } from '../stores/school.store'

const auth = useAuthStore()
const can = useCan('schools')
const store = useSchoolStore()
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  page: { type: 'page' },
  search: { type: 'string' },
  level: { type: 'string', options: EDUCATION_LEVELS },
  is_active: { type: 'boolean' },
})
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

async function load() {
  try {
    await store.fetchSchools({
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      educationLevel: query.value.level,
      isActive: query.value.is_active,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && load(), { immediate: true })

// ---- Tambah / ubah ----
const dialogVisible = ref(false)
const editingSchool = ref(null)

function openCreate() {
  editingSchool.value = null
  dialogVisible.value = true
}

function openEdit(school) {
  editingSchool.value = school
  dialogVisible.value = true
}

async function saveSchool(values) {
  if (editingSchool.value) {
    await store.updateSchool(editingSchool.value.id, values)
    notify.success('Sekolah berhasil diperbarui')
  } else {
    await store.createSchool(values)
    notify.success('Sekolah berhasil ditambahkan')
  }
}

async function removeSchool(school) {
  if (!(await confirmDelete(`sekolah "${school.name}"`))) return
  try {
    await store.deleteSchool(school.id)
    notify.success('Sekolah berhasil dihapus')
    if (store.lastQuery.page !== query.value.page) update({ page: store.lastQuery.page })
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Sekolah"
      :description="auth.isPlatformUser ? 'Kelola sekolah di platform' : 'Profil sekolah Anda'"
    >
      <template #actions>
        <Button v-if="can.create" label="Tambah sekolah" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <Card>
      <template #content>
        <div class="form-stack">
          <div class="toolbar">
            <IconField class="toolbar__search">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchInput"
                placeholder="Cari nama, kode, atau NPSN"
                aria-label="Cari sekolah"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="query.level || null"
              :options="EDUCATION_LEVEL_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Semua jenjang"
              aria-label="Filter jenjang"
              show-clear
              @update:model-value="(value) => update({ level: value ?? '', page: 1 })"
            />
            <Select
              class="toolbar__filter"
              :model-value="query.is_active"
              :options="ACTIVE_STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Semua status"
              aria-label="Filter status"
              show-clear
              @update:model-value="(value) => update({ is_active: value ?? null, page: 1 })"
            />
          </div>

          <SchoolTable
            :schools="store.items"
            :loading="store.loading"
            :total-records="store.meta.total"
            :page="query.page"
            :rows="DEFAULT_PAGE_SIZE"
            :can-update="can.update"
            :can-delete="can.delete && auth.isPlatformUser"
            @page="(page) => update({ page })"
            @edit="openEdit"
            @delete="removeSchool"
          />
        </div>
      </template>
    </Card>

    <SchoolFormDialog
      v-model:visible="dialogVisible"
      :school="editingSchool"
      :restricted="!auth.isPlatformUser"
      :submit="saveSchool"
    />
  </div>
</template>
