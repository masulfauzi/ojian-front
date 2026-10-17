<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import 'leaflet/dist/leaflet.css'

/**
 * Peta OpenStreetMap untuk memilih satu titik (klik peta atau seret penanda) dengan lingkaran
 * radius opsional. Leaflet dimuat dinamis agar tidak ikut bundle halaman lain.
 *
 *   <MapPicker v-model="point" :radius="200" />   // point: { latitude, longitude } | null
 */
const model = defineModel({ type: Object, default: null })
const props = defineProps({
  /** Radius lingkaran (meter); null = tanpa lingkaran. */
  radius: { type: Number, default: null },
  /** Titik awal peta bila belum ada titik (default: Jakarta). */
  center: { type: Object, default: () => ({ latitude: -6.2, longitude: 106.8166 }) },
  zoom: { type: Number, default: 16 },
  disabled: { type: Boolean, default: false },
  height: { type: String, default: '20rem' },
})

const el = ref(null)
const failed = ref(false)
const map = shallowRef(null)
let L = null
let marker = null
let circle = null

const hasPoint = (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)

function render() {
  if (!map.value) return
  const point = model.value
  if (!hasPoint(point)) {
    marker?.remove()
    circle?.remove()
    marker = circle = null
    return
  }
  const latlng = [point.latitude, point.longitude]
  if (!marker) {
    marker = L.circleMarker(latlng, {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#10b981',
      fillOpacity: 1,
    }).addTo(map.value)
  } else marker.setLatLng(latlng)
  if (props.radius) {
    if (!circle)
      circle = L.circle(latlng, {
        radius: props.radius,
        color: '#10b981',
        weight: 2,
        fillOpacity: 0.12,
      }).addTo(map.value)
    else circle.setLatLng(latlng).setRadius(props.radius)
  } else {
    circle?.remove()
    circle = null
  }
}

function setPoint(latlng) {
  if (props.disabled) return
  model.value = {
    latitude: Math.round(latlng.lat * 1e6) / 1e6,
    longitude: Math.round(latlng.lng * 1e6) / 1e6,
  }
}

onMounted(async () => {
  try {
    L = (await import('leaflet')).default
  } catch {
    failed.value = true
    return
  }
  const start = hasPoint(model.value) ? model.value : props.center
  map.value = L.map(el.value, { scrollWheelZoom: false }).setView(
    [start.latitude, start.longitude],
    props.zoom,
  )
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map.value)
  map.value.on('click', (event) => setPoint(event.latlng))
  render()
})

watch(
  () => [model.value?.latitude, model.value?.longitude, props.radius],
  () => render(),
)

/** Pusatkan peta ke titik (mis. setelah "Gunakan lokasi saya"). */
function focus(point = model.value) {
  if (map.value && hasPoint(point)) map.value.setView([point.latitude, point.longitude], props.zoom)
}

onBeforeUnmount(() => map.value?.remove())

defineExpose({ focus })
</script>

<template>
  <div class="map-picker" :class="{ 'is-disabled': disabled }">
    <div ref="el" class="map-picker__map" :style="{ height }" />
    <p v-if="failed" class="text-muted">Peta tidak dapat dimuat. Isi koordinat secara manual.</p>
  </div>
</template>
