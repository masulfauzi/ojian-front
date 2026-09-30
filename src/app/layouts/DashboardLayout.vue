<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import { useNotify } from '@/shared/composables/useNotify'
import { useAuthStore } from '@/modules/auth'
import { useMenu } from '../menu'
import { canAccessRoute } from '../router/guards'
import SidebarNav from './SidebarNav.vue'

const appName = import.meta.env.VITE_APP_NAME || 'Exam Web'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menu = useMenu()
const notify = useNotify()

const drawerOpen = ref(false)
// Tutup drawer setelah pindah halaman (layar kecil).
watch(
  () => route.fullPath,
  () => (drawerOpen.value = false),
)

const userMenu = ref()
const userMenuItems = [
  { label: 'Profil', icon: 'pi pi-user', command: () => router.push({ name: 'profile' }) },
  { separator: true },
  { label: 'Keluar', icon: 'pi pi-sign-out', command: logout },
]

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

const scopeLabel = computed(() => auth.user?.school?.name ?? 'Platform')

/** Setelah role aktif berubah, pindah ke halaman awal bila halaman ini tidak lagi diizinkan. */
function ensureRouteAllowed() {
  if (!canAccessRoute(route, auth)) router.replace(auth.homeRoute())
}

// ---- Pemilih role ----
const switchingRole = ref(false)

async function switchRole(roleId) {
  if (!roleId || roleId === auth.activeRole?.id) return
  switchingRole.value = true
  try {
    const role = await auth.switchRole(roleId)
    notify.success(`Role aktif sekarang ${role.name}`, 'Role diganti')
    ensureRouteAllowed()
  } catch (error) {
    notify.error(error)
  } finally {
    switchingRole.value = false
  }
}

// Refresh token jatuh ke role default karena role sebelumnya dicabut/nonaktif.
watch(
  () => auth.roleChangedNotice,
  (notice) => {
    if (!notice) return
    notify.warn(`Role Anda berubah menjadi ${notice.role?.name ?? '-'}.`, 'Role berubah')
    ensureRouteAllowed()
  },
)
</script>

<template>
  <div class="dashboard-layout">
    <aside class="dashboard-layout__sidebar" aria-label="Navigasi utama">
      <div class="brand">
        <i class="pi pi-book" aria-hidden="true" />
        <span>{{ appName }}</span>
      </div>
      <SidebarNav :items="menu" />
    </aside>

    <Drawer v-model:visible="drawerOpen" :header="appName" class="dashboard-drawer">
      <SidebarNav :items="menu" />
    </Drawer>

    <div class="dashboard-layout__main">
      <header class="topbar">
        <Button
          class="topbar__menu-toggle"
          icon="pi pi-bars"
          text
          rounded
          aria-label="Buka menu"
          @click="drawerOpen = true"
        />
        <div class="topbar__spacer" />

        <Select
          v-if="auth.hasMultipleRoles"
          class="topbar__role"
          :model-value="auth.activeRole?.id"
          :options="auth.roles"
          option-label="name"
          option-value="id"
          :loading="switchingRole"
          :disabled="switchingRole"
          aria-label="Role aktif"
          @update:model-value="switchRole"
        >
          <template #value="{ value }">
            <span class="topbar__role-value">
              <i class="pi pi-id-card" aria-hidden="true" />
              {{ auth.roles.find((r) => r.id === value)?.name }}
            </span>
          </template>
        </Select>

        <button
          type="button"
          class="topbar__user"
          aria-haspopup="true"
          aria-controls="user-menu"
          @click="userMenu.toggle($event)"
        >
          <Avatar :label="initials(auth.user?.name)" shape="circle" />
          <span class="topbar__user-text">
            <span class="topbar__user-name">{{ auth.user?.name }}</span>
            <span class="topbar__user-role"> {{ auth.activeRole?.name }} · {{ scopeLabel }} </span>
          </span>
          <i class="pi pi-angle-down" aria-hidden="true" />
        </button>
        <Menu id="user-menu" ref="userMenu" :model="userMenuItems" popup />
      </header>

      <main class="dashboard-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
