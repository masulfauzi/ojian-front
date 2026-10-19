<script setup>
import { defineAsyncComponent, ref } from 'vue'
import Button from 'primevue/button'
import { appName } from '../data/config'
import CtaButton from './CtaButton.vue'

// Header lengket: logo dan nama (pola yang sama dengan layout aplikasi), tautan bagian, dan CTA.
// Di layar sempit tautan pindah ke Drawer.
defineProps({
  /** [{ id, label }] — id bagian tujuan. */
  links: { type: Array, required: true },
  active: { type: String, default: '' },
})

// Drawer hanya dibutuhkan di layar sempit saat menu dibuka: dimuat saat pertama dibutuhkan.
const Drawer = defineAsyncComponent(() => import('primevue/drawer'))
const drawer = ref(false)
const drawerUsed = ref(false)
function openDrawer() {
  drawerUsed.value = true
  drawer.value = true
}
</script>

<template>
  <header class="landing-header" data-sticky-header>
    <div class="landing-container landing-header__inner">
      <RouterLink
        :to="{ name: 'landing' }"
        class="landing-brand"
        :aria-label="`${appName()} — beranda`"
      >
        <i class="pi pi-book" aria-hidden="true" />
        <span>{{ appName() }}</span>
      </RouterLink>
      <nav class="landing-nav" aria-label="Navigasi halaman">
        <RouterLink
          v-for="link in links"
          :key="link.id"
          :to="{ name: 'landing', hash: `#${link.id}` }"
          class="landing-nav__link"
          :class="{ 'is-active': active === link.id }"
          :aria-current="active === link.id ? 'location' : undefined"
          >{{ link.label }}</RouterLink
        >
      </nav>
      <div class="landing-header__actions">
        <CtaButton />
        <Button
          class="landing-header__menu"
          icon="pi pi-bars"
          severity="secondary"
          text
          aria-label="Buka menu"
          :aria-expanded="drawer"
          aria-controls="landing-drawer"
          @click="openDrawer"
        />
      </div>
    </div>
    <Drawer
      v-if="drawerUsed"
      id="landing-drawer"
      v-model:visible="drawer"
      position="right"
      :header="appName()"
    >
      <nav class="landing-drawer-nav" aria-label="Navigasi halaman">
        <RouterLink
          v-for="link in links"
          :key="link.id"
          :to="{ name: 'landing', hash: `#${link.id}` }"
          class="landing-drawer-nav__link"
          @click="drawer = false"
          >{{ link.label }}</RouterLink
        >
      </nav>
    </Drawer>
  </header>
</template>
