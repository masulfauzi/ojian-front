<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolSelect, useSchoolNames } from '@/modules/school'
import RoleFormDialog from '../components/RoleFormDialog.vue'
import RoleTable from '../components/RoleTable.vue'
import { useRoleStore } from '../stores/role.store'

const router = useRouter()
const auth = useAuthStore()
const can = useCan('roles')
const store = useRoleStore()
const schools = useSchoolNames()
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  page: { type: 'page' },
  search: { type: 'string' },
  school_id: { type: 'string' },
})
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

async function load() {
  try {
    await store.fetchRoles({
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      schoolId: auth.isPlatformUser ? query.value.school_id : '',
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && load(), { immediate: true })
watch(
  () => store.items,
  (roles) => auth.isPlatformUser && schools.load(roles.map((role) => role.schoolId)),
)

// Role sistem hanya dapat diubah pengguna platform.
const canEdit = (role) => can.value.update && (!role.isSystem || auth.isPlatformUser)
const schoolName = (role) =>
  auth.isPlatformUser ? schools.nameOf(role.schoolId) : auth.user?.school?.name

// ---- Tambah / ubah ----
const dialogVisible = ref(false)
const editingRole = ref(null)

function openCreate() {
  editingRole.value = null
  dialogVisible.value = true
}

function openEdit(role) {
  editingRole.value = role
  dialogVisible.value = true
}

async function saveRole(values) {
  if (editingRole.value) {
    await store.updateRole(editingRole.value.id, values)
    notify.success('Role berhasil diperbarui')
  } else {
    await store.createRole(values)
    notify.success('Role berhasil ditambahkan')
  }
}

async function removeRole(role) {
  if (!(await confirmDelete(`role "${role.name}"`))) return
  try {
    await store.deleteRole(role.id)
    notify.success('Role berhasil dihapus')
    if (store.lastQuery.page !== query.value.page) update({ page: store.lastQuery.page })
  } catch (error) {
    notify.error(error)
  }
}

const openPermissions = (role) => router.push({ name: 'role-permissions', params: { id: role.id } })
</script>

<template>
  <div class="page">
    <PageHeader title="Role & Hak Akses" description="Atur role dan menu yang boleh dibuka">
      <template #actions>
        <Button v-if="can.create" label="Tambah role" icon="pi pi-plus" @click="openCreate" />
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
                placeholder="Cari nama atau kode"
                aria-label="Cari role"
                fluid
              />
            </IconField>
            <div v-if="auth.isPlatformUser" class="toolbar__filter toolbar__filter--wide">
              <SchoolSelect
                :model-value="query.school_id || null"
                placeholder="Semua sekolah"
                @update:model-value="(value) => update({ school_id: value ?? '', page: 1 })"
              />
            </div>
          </div>

          <RoleTable
            :roles="store.items"
            :loading="store.loading"
            :total-records="store.meta.total"
            :page="query.page"
            :rows="DEFAULT_PAGE_SIZE"
            :school-name="schoolName"
            :can-edit="canEdit"
            :can-delete="can.delete"
            @page="(page) => update({ page })"
            @edit="openEdit"
            @permissions="openPermissions"
            @delete="removeRole"
          />
        </div>
      </template>
    </Card>

    <RoleFormDialog
      v-model:visible="dialogVisible"
      :role="editingRole"
      :choose-school="auth.isPlatformUser"
      :submit="saveRole"
    />
  </div>
</template>
