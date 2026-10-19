<script setup>
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Timeline from 'primevue/timeline'
import { WORKFLOWS } from '../data/workflows'
</script>

<template>
  <Tabs :value="WORKFLOWS[0].id" class="landing-tabs">
    <TabList>
      <Tab v-for="flow in WORKFLOWS" :key="flow.id" :value="flow.id">
        <i :class="flow.icon" aria-hidden="true" /> {{ flow.title }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel v-for="flow in WORKFLOWS" :key="flow.id" :value="flow.id">
        <h3 class="visually-hidden">Alur {{ flow.title.toLowerCase() }}</h3>
        <Timeline :value="flow.steps" class="landing-timeline">
          <template #marker="{ index }">
            <span class="landing-timeline__marker" aria-hidden="true">{{ index + 1 }}</span>
          </template>
          <template #content="{ item }">
            <div class="landing-timeline__content">
              <strong>{{ item.title }}</strong>
              <span>{{ item.summary }}</span>
            </div>
          </template>
        </Timeline>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
