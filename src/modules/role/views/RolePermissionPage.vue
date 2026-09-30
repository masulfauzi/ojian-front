<script setup>
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { ACTIONS, ACTION_LABELS } from '@/shared/constants/permissions'
import { useAuthStore, useCan } from '@/modules/auth'
import { getRole, getRoleMatrix, saveRoleMatrix } from '../api/role.api'
import {
  groupRows,
  isColumnFull,
  isMatrixDirty,
  isRowFull,
  setColumn,
  setPermission,
  setRow,
} from '../utils/matrix'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const can = useCan('roles')
const notify = useNotify()
const { ask } = useConfirm()

const role = ref(null)
const rows = ref([])
const original = ref([])
const loading = ref(true)
const saving = ref(false)
const loadError = ref(null)

// Role sistem hanya dapat diubah pengguna platform.
const readonly = computed(() => !can.value.update || (role.value?.isSystem && !auth.isPlatformUser))

/** Pemberi hanya dapat memberi hak yang ia miliki sendiri. */
const isAllowed = (row, action) => !readonly.value && auth.can(row.code, action)

const dirty = computed(() => isMatrixDirty(rows.value, original.value))

/** Nama grup dari pohon menu sidebar; halaman tanpa induk masuk grup "Umum". */
function groupName(parentId) {
  if (!parentId) return 'Umum'
  return auth.menus.find((menu) => menu.id === parentId)?.name ?? 'Lainnya'
}
const groups = computed(() => groupRows(rows.value, groupName))

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [roleData, matrix] = await Promise.all([
      getRole(route.params.id),
      getRoleMatrix(route.params.id),
    ])
    role.value = roleData
    rows.value = matrix
    original.value = matrix
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ---- Ubah centang ----
function replaceRow(next) {
  rows.value = rows.value.map((row) => (row.menuId === next.menuId ? next : row))
}
const toggle = (row, action, value) => replaceRow(setPermission(row, action, value))
const toggleRow = (row, value) => replaceRow(setRow(row, value, isAllowed))
const toggleColumn = (action, value) =>
  (rows.value = setColumn(rows.value, action, value, isAllowed))

const reset = () => (rows.value = original.value)

async function save() {
  saving.value = true
  try {
    const saved = await saveRoleMatrix(role.value.id, rows.value)
    rows.value = saved
    original.value = saved
    notify.success('Hak akses berhasil disimpan')
    // Hak role aktif sendiri berubah: muat ulang sidebar dan izin.
    if (role.value.id === auth.activeRole?.id) await auth.loadAccess()
  } catch (error) {
    notify.error(error)
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return ask({
    header: 'Perubahan belum disimpan',
    message: 'Hak akses yang diubah belum disimpan. Tinggalkan halaman ini?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    danger: true,
  })
})
</script>

<template>
  <div class="page">
    <PageHeader
      :title="role ? `Hak akses: ${role.name}` : 'Hak akses'"
      description="Centang menu yang boleh dibuka role ini beserta aksinya."
    >
      <template #actions>
        <Button
          label="Kembali"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'roles' })"
        />
        <template v-if="!readonly && rows.length">
          <Button
            label="Batalkan"
            severity="secondary"
            text
            :disabled="!dirty || saving"
            @click="reset"
          />
          <Button
            label="Simpan"
            icon="pi pi-check"
            :loading="saving"
            :disabled="!dirty || saving"
            @click="save"
          />
        </template>
      </template>
    </PageHeader>

    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 3rem" /></div>

    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Gagal memuat hak akses"
      :description="loadError.message"
    >
      <Button label="Coba lagi" icon="pi pi-refresh" @click="load" />
    </EmptyState>

    <template v-else>
      <Message v-if="readonly" severity="info" :closable="false">
        {{
          role?.isSystem && !auth.isPlatformUser
            ? 'Hak akses role sistem hanya dapat diubah oleh admin platform.'
            : 'Anda hanya dapat melihat hak akses role ini.'
        }}
      </Message>
      <Message v-else severity="secondary" :closable="false">
        Tambah, ubah, dan hapus memerlukan hak lihat. Kotak yang tidak dapat dicentang adalah hak
        yang tidak Anda miliki sendiri.
      </Message>

      <Card>
        <template #content>
          <div class="matrix-scroll">
            <table class="matrix">
              <thead>
                <tr>
                  <th class="matrix__menu">Menu</th>
                  <th v-for="action in ACTIONS" :key="action">
                    <label class="matrix__head">
                      <Checkbox
                        binary
                        :model-value="isColumnFull(rows, action)"
                        :disabled="readonly"
                        :aria-label="`Semua ${ACTION_LABELS[action]}`"
                        @update:model-value="(value) => toggleColumn(action, value)"
                      />
                      {{ ACTION_LABELS[action] }}
                    </label>
                  </th>
                  <th>Semua</th>
                </tr>
              </thead>
              <tbody v-for="group in groups" :key="group.key">
                <tr class="matrix__group">
                  <th :colspan="ACTIONS.length + 2">{{ group.name }}</th>
                </tr>
                <tr v-for="row in group.rows" :key="row.menuId" :class="{ 'is-granted': row.view }">
                  <td class="matrix__menu">
                    {{ row.name }} <code class="text-muted">{{ row.code }}</code>
                  </td>
                  <td v-for="action in ACTIONS" :key="action">
                    <Checkbox
                      binary
                      :model-value="row[action]"
                      :disabled="!isAllowed(row, action)"
                      :aria-label="`${ACTION_LABELS[action]} ${row.name}`"
                      @update:model-value="(value) => toggle(row, action, value)"
                    />
                  </td>
                  <td>
                    <Checkbox
                      binary
                      :model-value="isRowFull(row)"
                      :disabled="readonly"
                      :aria-label="`Semua hak ${row.name}`"
                      @update:model-value="(value) => toggleRow(row, value)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="dirty" class="text-muted matrix__dirty">
            <Tag severity="warn" value="Belum disimpan" /> Ada perubahan yang belum disimpan.
          </p>
        </template>
      </Card>
    </template>
  </div>
</template>
