<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useDebounceFn } from '@/shared/composables/useDebounce'
import { useNotify } from '@/shared/composables/useNotify'
import { ROLES, ROLE_OPTIONS, useAuthStore } from '@/modules/auth'
import UserFormDialog from '../components/UserFormDialog.vue'
import UserTable from '../components/UserTable.vue'
import { DEFAULT_LIMIT, useUserStore } from '../stores/user.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useUserStore()
const notify = useNotify()
const { confirmDelete } = useConfirm()

// Sumber kebenaran filter adalah query URL (?page=&search=&role=) agar bisa di-refresh/dibagikan.
const page = computed(() => Math.max(1, Number.parseInt(route.query.page, 10) || 1))
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
const role = computed(() => (ROLES.includes(route.query.role) ? route.query.role : ''))

function updateQuery(patch) {
  const next = { page: page.value, search: search.value, role: role.value, ...patch }
  const query = {}
  if (next.page > 1) query.page = String(next.page)
  if (next.search) query.search = next.search
  if (next.role) query.role = next.role
  router.replace({ query })
}

// Input pencarian: nilai lokal langsung berubah, URL diperbarui setelah 300 ms.
const searchInput = ref(search.value)
const applySearch = useDebounceFn((value) => updateQuery({ search: value.trim(), page: 1 }), 300)
watch(searchInput, (value) => applySearch(value))
// Sinkron balik saat URL berubah dari luar (tombol back/forward).
watch(search, (value) => {
  if (value !== searchInput.value.trim()) searchInput.value = value
})

async function load() {
  try {
    await store.fetchUsers({
      page: page.value,
      limit: DEFAULT_LIMIT,
      search: search.value,
      role: role.value,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(
  [page, search, role],
  () => {
    if (route.name === 'users') load()
  },
  { immediate: true },
)

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
    notify.success('User berhasil diperbarui')
  } else {
    await store.createUser(values)
    notify.success('User berhasil dibuat')
  }
}

// ---- Hapus ----
async function removeUser(user) {
  if (!(await confirmDelete(`user "${user.name}"`))) return
  try {
    await store.deleteUser(user.id)
    notify.success('User berhasil dihapus')
    // Store bisa mundur satu halaman bila halaman ini kosong; samakan URL.
    if (store.lastQuery.page !== page.value) updateQuery({ page: store.lastQuery.page })
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader title="Manajemen User" description="Kelola akun admin, guru, dan siswa">
      <template #actions>
        <Button label="Tambah user" icon="pi pi-plus" @click="openCreate" />
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
                placeholder="Cari nama atau email"
                aria-label="Cari user"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="role || null"
              :options="ROLE_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Semua role"
              aria-label="Filter role"
              show-clear
              @update:model-value="(value) => updateQuery({ role: value ?? '', page: 1 })"
            />
          </div>

          <UserTable
            :users="store.items"
            :loading="store.loading"
            :total-records="store.meta.total"
            :page="page"
            :rows="DEFAULT_LIMIT"
            :current-user-id="auth.user?.id"
            @page="(value) => updateQuery({ page: value })"
            @edit="openEdit"
            @delete="removeUser"
          />
        </div>
      </template>
    </Card>

    <UserFormDialog v-model:visible="dialogVisible" :user="editingUser" :submit="saveUser" />
  </div>
</template>
