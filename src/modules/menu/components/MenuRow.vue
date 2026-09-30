<script setup>
import Button from 'primevue/button'
import Tag from 'primevue/tag'

defineProps({
  menu: { type: Object, required: true },
  /** Kelas pegangan drag, berbeda per tingkat agar daftar bersarang tidak saling berebut. */
  handleClass: { type: String, required: true },
  canUpdate: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  /** Alasan aksi dinonaktifkan (mis. ada urutan belum disimpan). */
  lockedReason: { type: String, default: '' },
})

const emit = defineEmits(['edit', 'delete'])

const deleteBlockedReason = (menu) => {
  if (menu.isSystem) return 'Menu sistem tidak dapat dihapus'
  if (menu.children?.length) return 'Kosongkan grup ini lebih dulu'
  return ''
}
</script>

<template>
  <div
    class="menu-row"
    :class="{ 'is-group': menu.type === 'group', 'is-inactive': !menu.isActive }"
  >
    <i :class="['pi pi-bars drag-handle', handleClass]" aria-label="Seret untuk mengurutkan" />
    <i :class="['menu-row__icon', menu.icon || 'pi pi-circle']" aria-hidden="true" />
    <div class="menu-row__text">
      <span class="menu-row__name">{{ menu.name }}</span>
      <span class="text-muted">
        <code>{{ menu.code }}</code>
        <template v-if="menu.path"> · {{ menu.path }}</template>
      </span>
    </div>
    <div class="menu-row__tags">
      <Tag v-if="menu.type === 'group'" value="Grup" severity="info" />
      <Tag v-if="menu.isSystem" value="Sistem" severity="contrast" icon="pi pi-lock" />
      <Tag v-if="!menu.isActive" value="Nonaktif" severity="secondary" />
    </div>
    <div class="row-actions">
      <span v-if="canUpdate" v-tooltip.top="lockedReason || 'Ubah'">
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          text
          rounded
          :disabled="!!lockedReason"
          :aria-label="`Ubah ${menu.name}`"
          @click="emit('edit', menu)"
        />
      </span>
      <span v-if="canDelete" v-tooltip.top="lockedReason || deleteBlockedReason(menu) || 'Hapus'">
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :disabled="!!lockedReason || !!deleteBlockedReason(menu)"
          :aria-label="`Hapus ${menu.name}`"
          @click="emit('delete', menu)"
        />
      </span>
    </div>
  </div>
</template>
