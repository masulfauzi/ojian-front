<script setup>
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SortableList from '@/shared/components/SortableList.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useAuthStore, useCan } from '@/modules/auth'
import { createMenu, deleteMenu, getMenuTree, reorderMenus, updateMenu } from '../api/menu.api'
import MenuFormDialog from '../components/MenuFormDialog.vue'
import MenuRow from '../components/MenuRow.vue'
import {
  buildReorderItems,
  cloneTree,
  countMoved,
  groupsOf,
  nextSortOrder,
  positionsOf,
  slotsOf,
} from '../utils/tree'

const auth = useAuthStore()
const can = useCan('menus')
const notify = useNotify()
const { ask, confirmDelete } = useConfirm()

const tree = ref([])
const original = ref(new Map())
const originalSlots = ref(new Map())
const loading = ref(true)
const saving = ref(false)
const loadError = ref(null)

// "Belum disimpan" dihitung dari perpindahan posisi; saat disimpan semua nomor urut dirapikan.
const movedCount = computed(() => countMoved(tree.value, originalSlots.value))
const dirty = computed(() => movedCount.value > 0)
const lockedReason = computed(() => (dirty.value ? 'Simpan atau batalkan urutan lebih dulu' : ''))
const groups = computed(() => groupsOf(tree.value))

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const data = await getMenuTree()
    tree.value = cloneTree(data)
    original.value = positionsOf(data)
    originalSlots.value = slotsOf(data)
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}

onMounted(load)

/** Setelah struktur menu berubah, sidebar role aktif ikut dimuat ulang. */
async function refreshAll() {
  await load()
  await auth.loadAccess().catch(() => {})
}

// ---- Drag & drop ----
const SORTABLE_OPTIONS = { fallbackOnBody: true, swapThreshold: 0.65, emptyInsertThreshold: 12 }
const menuAttrs = (menu) => ({ 'data-menu-type': menu.type })
// Daftar anak grup menolak grup lain agar kedalaman tetap maksimal 2.
const childGroup = {
  name: 'menus',
  put: (_to, _from, dragEl) => dragEl.dataset.menuType !== 'group',
}

async function saveOrder() {
  saving.value = true
  try {
    await reorderMenus(buildReorderItems(tree.value, original.value))
    notify.success('Urutan menu berhasil disimpan')
    await refreshAll()
  } catch (error) {
    notify.error(error)
  } finally {
    saving.value = false
  }
}

async function cancelOrder() {
  await load()
}

// ---- Tambah / ubah / hapus ----
const dialogVisible = ref(false)
const editingMenu = ref(null)

function openCreate() {
  editingMenu.value = null
  dialogVisible.value = true
}

function openEdit(menu) {
  editingMenu.value = menu
  dialogVisible.value = true
}

async function saveMenu(values) {
  if (editingMenu.value) {
    await updateMenu(editingMenu.value.id, values)
    notify.success('Menu berhasil diperbarui')
  } else {
    await createMenu(values)
    notify.success('Menu berhasil ditambahkan')
  }
  await refreshAll()
}

async function removeMenu(menu) {
  if (!(await confirmDelete(`menu "${menu.name}"`))) return
  try {
    await deleteMenu(menu.id)
    notify.success('Menu berhasil dihapus')
    await refreshAll()
  } catch (error) {
    notify.error(error)
  }
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return ask({
    header: 'Urutan belum disimpan',
    message: 'Perubahan urutan menu belum disimpan. Tinggalkan halaman ini?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    danger: true,
  })
})
</script>

<template>
  <div class="page">
    <PageHeader title="Menu" description="Atur menu sidebar, urutan, dan pengelompokannya">
      <template #actions>
        <template v-if="can.update && dirty">
          <Button
            label="Batalkan"
            severity="secondary"
            text
            :disabled="saving"
            @click="cancelOrder"
          />
          <Button
            label="Simpan urutan"
            icon="pi pi-check"
            :loading="saving"
            :disabled="saving"
            @click="saveOrder"
          />
        </template>
        <span v-if="can.create" v-tooltip.bottom="lockedReason">
          <Button label="Tambah menu" icon="pi pi-plus" :disabled="dirty" @click="openCreate" />
        </span>
      </template>
    </PageHeader>

    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 3rem" /></div>

    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Gagal memuat menu"
      :description="loadError.message"
    >
      <Button label="Coba lagi" icon="pi pi-refresh" @click="load" />
    </EmptyState>

    <template v-else>
      <Message v-if="can.update" severity="secondary" :closable="false">
        Seret <i class="pi pi-bars" aria-hidden="true" /> untuk mengubah urutan atau memindahkan
        halaman ke grup lain. Grup tidak dapat dimasukkan ke grup lain.
        <Tag v-if="dirty" severity="warn" :value="`${movedCount} menu dipindah, belum disimpan`" />
      </Message>

      <Card>
        <template #content>
          <EmptyState v-if="!tree.length" icon="pi pi-bars" title="Belum ada menu" />
          <SortableList
            v-else
            v-model="tree"
            class="menu-tree"
            handle=".menu-handle--root"
            :group="{ name: 'menus' }"
            :disabled="!can.update || saving"
            :item-attrs="menuAttrs"
            :options="SORTABLE_OPTIONS"
          >
            <template #item="{ item }">
              <MenuRow
                :menu="item"
                handle-class="menu-handle--root"
                :can-update="can.update"
                :can-delete="can.delete"
                :locked-reason="lockedReason"
                @edit="openEdit"
                @delete="removeMenu"
              />
              <SortableList
                v-if="item.type === 'group'"
                v-model="item.children"
                class="menu-tree menu-tree--children"
                handle=".menu-handle--child"
                :group="childGroup"
                :disabled="!can.update || saving"
                :item-attrs="menuAttrs"
                :options="SORTABLE_OPTIONS"
              >
                <template #item="{ item: child }">
                  <MenuRow
                    :menu="child"
                    handle-class="menu-handle--child"
                    :can-update="can.update"
                    :can-delete="can.delete"
                    :locked-reason="lockedReason"
                    @edit="openEdit"
                    @delete="removeMenu"
                  />
                </template>
              </SortableList>
            </template>
          </SortableList>
        </template>
      </Card>
    </template>

    <MenuFormDialog
      v-model:visible="dialogVisible"
      :menu="editingMenu"
      :groups="groups"
      :next-sort-order="(parentId) => nextSortOrder(tree, parentId)"
      :submit="saveMenu"
    />
  </div>
</template>
