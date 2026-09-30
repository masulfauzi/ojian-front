<script setup>
// Pembungkus komponen Chart PrimeVue. Komponen Chart.js yang tersedia didaftarkan secara
// eksplisit di `shared/utils/chart.js` (lihat alias `chart.js/auto` di vite.config.js).
import { computed } from 'vue'
import Chart from 'primevue/chart'

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  height: { type: String, default: '18rem' },
})

const mergedOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.options,
}))
</script>

<template>
  <Chart
    :type="type"
    :data="data"
    :options="mergedOptions"
    :style="{ height, position: 'relative' }"
  />
</template>
