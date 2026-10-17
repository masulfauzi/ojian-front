<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useCamera } from '@/shared/composables/useCamera'
import { useGeolocation } from '@/shared/composables/useGeolocation'
import { checkInErrorField } from '../utils/errors'

/**
 * Presensi selfie: kamera langsung (cadangan: kamera/galeri perangkat), lokasi bila geofence aktif,
 * lalu kirim lewat prop `submit({ selfie, location })`.
 */
const props = defineProps({
  requireSelfie: { type: Boolean, default: true },
  /** off | flag | enforce */
  geofenceMode: { type: String, default: 'off' },
  /** async ({ selfie, location }) → hasil; melempar ApiError. */
  submit: { type: Function, required: true },
})

const video = ref(null)
const fileInput = ref(null)
const camera = useCamera()
const geo = useGeolocation()

const photo = ref(null) // Blob
const photoUrl = ref('')
const location = ref(null)
const errors = ref({ selfie: '', location: '', general: '' })
const sending = ref(false)

const needsLocation = computed(() => props.geofenceMode !== 'off')
const cameraUnavailable = computed(() =>
  ['denied', 'unsupported', 'error'].includes(camera.status.value),
)
const ready = computed(
  () => (!props.requireSelfie || photo.value) && (!needsLocation.value || location.value),
)

function setPhoto(blob) {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photo.value = blob
  photoUrl.value = blob ? URL.createObjectURL(blob) : ''
  errors.value.selfie = ''
}

async function startCamera() {
  setPhoto(null)
  await camera.start(video.value)
}

async function takePhoto() {
  const blob = await camera.capture()
  if (!blob) {
    errors.value.selfie = 'Gambar kamera belum siap, coba lagi.'
    return
  }
  setPhoto(blob)
  camera.stop()
}

function onFilePicked(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errors.value.selfie = 'Pilih berkas foto (JPEG, PNG, atau WebP).'
    return
  }
  setPhoto(file)
}

async function findLocation() {
  errors.value.location = ''
  try {
    location.value = await geo.locate()
  } catch (error) {
    location.value = null
    errors.value.location = error.message
  }
}

async function send() {
  errors.value = { selfie: '', location: '', general: '' }
  sending.value = true
  try {
    await props.submit({
      selfie: props.requireSelfie ? photo.value : null,
      location: needsLocation.value ? location.value : null,
    })
  } catch (error) {
    const field = checkInErrorField(error)
    errors.value[field ?? 'general'] = error.message
    // Foto yang sama ditolak (duplikat) atau tidak valid: minta ambil ulang.
    if (field === 'selfie' && props.requireSelfie && !cameraUnavailable.value) startCamera()
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  if (props.requireSelfie) startCamera()
  if (needsLocation.value) findLocation()
})
onBeforeUnmount(() => setPhoto(null))
</script>

<template>
  <div class="checkin-panel">
    <section v-if="requireSelfie" class="checkin-panel__selfie" aria-label="Foto selfie">
      <div class="selfie-frame" :class="{ 'has-photo': photoUrl }">
        <video
          v-show="!photoUrl && camera.status.value !== 'idle' && !cameraUnavailable"
          ref="video"
          class="selfie-frame__video"
          autoplay
          muted
          playsinline
        />
        <img v-if="photoUrl" :src="photoUrl" alt="Pratinjau selfie" class="selfie-frame__photo" />
        <div v-if="!photoUrl && cameraUnavailable" class="selfie-frame__fallback">
          <i class="pi pi-camera" aria-hidden="true" />
          <p>{{ camera.error.value }}</p>
        </div>
        <div v-if="camera.status.value === 'starting'" class="selfie-frame__fallback">
          <i class="pi pi-spin pi-spinner" aria-hidden="true" />
          <p>Membuka kamera…</p>
        </div>
      </div>
      <div class="checkin-panel__actions">
        <Button
          v-if="!photoUrl && camera.status.value === 'live'"
          label="Ambil foto"
          icon="pi pi-camera"
          @click="takePhoto"
        />
        <Button
          v-if="photoUrl"
          label="Ulangi foto"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="cameraUnavailable ? fileInput.click() : startCamera()"
        />
        <Button
          v-if="!photoUrl && cameraUnavailable"
          label="Buka kamera perangkat"
          icon="pi pi-image"
          @click="fileInput.click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          @change="onFilePicked"
        />
      </div>
      <small v-if="errors.selfie" class="form-field__error" role="alert">{{ errors.selfie }}</small>
      <small v-else class="text-muted">Pastikan wajah terlihat jelas.</small>
    </section>

    <section v-if="needsLocation" class="checkin-panel__location" aria-label="Lokasi">
      <div class="location-box" :class="{ 'is-ok': location, 'is-error': errors.location }">
        <i
          :class="
            geo.locating.value
              ? 'pi pi-spin pi-spinner'
              : location
                ? 'pi pi-map-marker'
                : 'pi pi-exclamation-circle'
          "
          aria-hidden="true"
        />
        <div>
          <strong v-if="geo.locating.value">Mencari lokasi…</strong>
          <strong v-else-if="location">Lokasi ditemukan</strong>
          <strong v-else>Lokasi belum didapat</strong>
          <div v-if="location" class="text-muted">Akurasi ±{{ location.accuracy }} m</div>
          <small v-if="errors.location" class="form-field__error" role="alert">{{
            errors.location
          }}</small>
        </div>
        <Button
          :label="location ? 'Perbarui' : 'Cari lokasi'"
          icon="pi pi-refresh"
          size="small"
          severity="secondary"
          text
          :loading="geo.locating.value"
          @click="findLocation"
        />
      </div>
      <small class="text-muted">
        {{
          geofenceMode === 'enforce'
            ? 'Presensi hanya diterima di area sekolah.'
            : 'Lokasi dicatat untuk pemeriksaan sekolah.'
        }}
      </small>
    </section>

    <Message v-if="errors.general" severity="error" :closable="false">{{ errors.general }}</Message>

    <Button
      class="checkin-panel__submit"
      label="Kirim presensi"
      icon="pi pi-send"
      size="large"
      :disabled="!ready || sending"
      :loading="sending"
      @click="send"
    />
  </div>
</template>
