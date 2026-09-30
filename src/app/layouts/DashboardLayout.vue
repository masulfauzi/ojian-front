<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Menu from 'primevue/menu'
import { useAuthStore, roleLabel } from '@/modules/auth'
import { useMenu } from '../menu'
import SidebarNav from './SidebarNav.vue'

const appName = import.meta.env.VITE_APP_NAME || 'Exam Web'
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const menu = useMenu()

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
            <span class="topbar__user-role">{{ roleLabel(auth.role) }}</span>
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
