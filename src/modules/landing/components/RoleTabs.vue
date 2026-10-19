<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ROLES } from '../data/roles'
</script>

<template>
  <Tabs :value="ROLES[0].id" scrollable class="landing-tabs">
    <TabList>
      <Tab v-for="role in ROLES" :key="role.id" :value="role.id">
        <i :class="role.icon" aria-hidden="true" /> {{ role.title }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel v-for="role in ROLES" :key="role.id" :value="role.id">
        <h3 class="visually-hidden">Kemampuan {{ role.title }}</h3>
        <ul class="role-abilities plain-list">
          <li v-for="ability in role.abilities" :key="ability">
            <i class="pi pi-check" aria-hidden="true" />
            <span>{{ ability }}</span>
          </li>
        </ul>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
