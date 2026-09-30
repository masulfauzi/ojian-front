<script setup>
import { computed, ref, watch } from 'vue'
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
import { listRoleOptions } from '@/modules/role'
import { SchoolSelect, useSchoolNames } from '@/modules/school'
import UserFormDialog from '../components/UserFormDialog.vue'
import UserTable from '../components/UserTable.vue'
import { useUserStore } from '../stores/user.store'

const auth = useAuthStore()
const can = useCan('users')
const store = useUserStore()
const schools = useSchoolNames()
const notify = useNotify()
const { confirmDelete } = useConfirm()

// Sumber kebenaran filter adalah query URL agar bisa di-refresh/dibagikan.
const { query, update, isActiveRoute } = useQueryState({
  page: { type: 'page' },
  search: { type: 'string' },
  role_id: { type: 'string' },
  is_active: { type: 'boolean' },
  school_id: { type: 'string' },
})
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

async function load() {
  try {
    await store.fetchUsers({
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      roleId: query.value.role_id,
      isActive: query.value.is_active,
      schoolId: auth.isPlatformUser ? query.value.school_id : '',
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && load(), { immediate: true })
watch(
  () => store.items,
  (users) => auth.isPlatformUser && schools.load(users.map((user) => user.schoolId)),
)

// Opsi filter role mengikuti sekolah yang difilter (role sistem + role kustom sekolah itu).
// GET /roles memerlukan hak lihat menu roles; tanpa hak itu filter role disembunyikan.
const canFilterRole = computed(() => auth.can('roles'))
const roleFilterOptions = ref([])
watch(
  () => query.value.school_id,
  async (schoolId) => {
    if (!canFilterRole.value) return
    try {
      roleFilterOptions.value = await listRoleOptions(schoolId || null)
    } catch {
      roleFilterOptions.value = []
    }
  },
  { immediate: true },
)

const schoolName = auth.isPlatformUser ? (user) => schools.nameOf(user.schoolId) : null

// ---- Tambah / ubah ----
const dialogVisible = ref(false)
const editingUser = ref(null)

function openCreate() {
  editingUser.value = null
  dialogVisible.value = true
}

function openEdit(user) {
  editingUser.value = user
  dialogVisible.value = true
}

async function saveUser(values) {
  if (editingUser.value) {
    await store.updateUser(editingUser.value.id, values)
    notify.success('Pengguna berhasil diperbarui')
  } else {
    await store.createUser(values)
    notify.success('Pengguna berhasil dibuat')
  }
}

async function removeUser(user) {
  if (!(await confirmDelete(`pengguna "${user.name}"`))) return
  try {
    await store.deleteUser(user.id)
    notify.success('Pengguna berhasil dihapus')
    if (store.lastQuery.page !== query.value.page) update({ page: store.lastQuery.page })
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader title="Pengguna" description="Kelola akun admin, guru, dan siswa">
      <template #actions>
        <Button v-if="can.create" label="Tambah pengguna" icon="pi pi-plus" @click="openCreate" />
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
                placeholder="Cari nama, username, atau email"
                aria-label="Cari pengguna"
                fluid
              />
            </IconField>
            <div v-if="auth.isPlatformUser" class="toolbar__filter toolbar__filter--wide">
              <SchoolSelect
                :model-value="query.school_id || null"
                placeholder="Semua sekolah"
                @update:model-value="
                  (value) => update({ school_id: value ?? '', role_id: '', page: 1 })
                "
              />
            </div>
            <Select
              v-if="canFilterRole"
              class="toolbar__filter"
              :model-value="query.role_id || null"
              :options="roleFilterOptions"
              option-label="name"
              option-value="id"
              placeholder="Semua role"
              aria-label="Filter role"
              show-clear
              @update:model-value="(value) => update({ role_id: value ?? '', page: 1 })"
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

          <UserTable
            :users="store.items"
            :loading="store.loading"
            :total-records="store.meta.total"
            :page="query.page"
            :rows="DEFAULT_PAGE_SIZE"
            :current-user-id="auth.user?.id"
            :school-name="schoolName"
            :can-update="can.update"
            :can-delete="can.delete"
            @page="(page) => update({ page })"
            @edit="openEdit"
            @delete="removeUser"
          />
        </div>
      </template>
    </Card>

    <UserFormDialog
      v-model:visible="dialogVisible"
      :user="editingUser"
      :choose-school="auth.isPlatformUser"
      :default-school-id="auth.user?.school?.id ?? null"
      :submit="saveUser"
    />
  </div>
</template>
