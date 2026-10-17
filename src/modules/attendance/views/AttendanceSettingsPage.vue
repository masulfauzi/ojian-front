<script setup>
import { computed, ref, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import EmptyState from '@/shared/components/EmptyState.vue'
import MapPicker from '@/shared/components/MapPicker.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useGeolocation } from '@/shared/composables/useGeolocation'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { timezoneAbbr } from '@/shared/constants/timezones'
import { formatDateTime } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { getSettings, updateSettings } from '../api/attendance.api'
import { GEOFENCE_MODES, WEEKDAYS } from '../constants'
import { settingsSchema } from '../schemas/attendance.schema'

const can = useCan('attendance_settings')
const canSchools = useCan('schools')
const notify = useNotify()
const geo = useGeolocation()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const readonly = computed(() => !can.value.update)

const settings = ref(null)
const loadError = ref(null)
const map = ref(null)

const form = useForm({ validationSchema: toTypedSchema(settingsSchema) })
const applyServerErrors = useServerErrors(form)
const { value: workDays, errorMessage: workDaysError } = useField('workDays')
const { value: geofenceMode } = useField('geofenceMode')
const { value: latitude, errorMessage: latitudeError } = useField('latitude')
const { value: longitude } = useField('longitude')
const { value: radius } = useField('geofenceRadiusM')

const point = computed({
  get: () =>
    Number.isFinite(latitude.value) && Number.isFinite(longitude.value)
      ? { latitude: latitude.value, longitude: longitude.value }
      : null,
  set: (value) => {
    latitude.value = value?.latitude ?? null
    longitude.value = value?.longitude ?? null
  },
})
const modeHint = computed(
  () => GEOFENCE_MODES.find((m) => m.value === geofenceMode.value)?.hint ?? '',
)
const mapsLink = computed(() =>
  point.value
    ? `https://www.google.com/maps?q=${point.value.latitude},${point.value.longitude}`
    : null,
)

function toValues(s) {
  return {
    opensAt: s.opensAt,
    onTimeUntil: s.onTimeUntil,
    closesAt: s.closesAt,
    workDays: [...s.workDays],
    requireSelfie: s.requireSelfie,
    selfieRetentionDays: s.selfieRetentionDays,
    geofenceMode: s.geofenceMode,
    latitude: s.latitude,
    longitude: s.longitude,
    geofenceRadiusM: s.geofenceRadiusM ?? 150,
    maxGpsAccuracyM: s.maxGpsAccuracyM,
    leaveProofRequired: s.leaveProofRequired,
    leaveMaxDays: s.leaveMaxDays,
    leaveBackdateDays: s.leaveBackdateDays,
  }
}

async function load() {
  loadError.value = null
  settings.value = null
  try {
    settings.value = await getSettings(scope())
    form.resetForm({ values: toValues(settings.value) })
  } catch (error) {
    loadError.value = error
  }
}
watch(
  () => [school.ready.value, school.scopeId.value],
  ([ready]) => ready && load(),
  { immediate: true },
)

async function useMyLocation() {
  try {
    const pos = await geo.locate()
    point.value = { latitude: pos.latitude, longitude: pos.longitude }
    map.value?.focus(point.value)
    notify.info(`Lokasi diambil (akurasi ±${pos.accuracy} m). Periksa titiknya di peta.`)
  } catch (error) {
    notify.error(error.message)
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  try {
    settings.value = await updateSettings(values, scope())
    form.resetForm({ values: toValues(settings.value) })
    notify.success('Pengaturan presensi disimpan')
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="Pengaturan Presensi"
      description="Jam presensi, hari sekolah, selfie, lokasi, dan aturan izin"
    >
      <template v-if="settings && !readonly" #actions>
        <Button
          label="Batalkan perubahan"
          severity="secondary"
          text
          :disabled="!form.meta.value.dirty || form.isSubmitting.value"
          @click="form.resetForm({ values: toValues(settings) })"
        />
        <Button
          type="submit"
          form="attendance-settings"
          label="Simpan"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="!form.meta.value.dirty"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Pengaturan tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!settings && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <form
      v-else-if="settings"
      id="attendance-settings"
      class="question-form"
      novalidate
      @submit="onSubmit"
    >
      <div class="question-form__main form-stack">
        <Message v-if="readonly" severity="secondary" :closable="false" icon="pi pi-lock">
          Anda hanya dapat melihat pengaturan ini.
        </Message>

        <Card>
          <template #title>Jam dan hari sekolah</template>
          <template #content>
            <div class="form-stack">
              <p class="text-muted">
                Jam menurut zona waktu sekolah ({{ timezoneAbbr(settings.timezone) }}).
                <RouterLink v-if="canSchools.update" :to="{ name: 'schools' }" class="link-strong"
                  >Ubah zona waktu di profil sekolah</RouterLink
                >
              </p>
              <div class="form-grid form-grid--3">
                <FormInputText
                  name="opensAt"
                  label="Dibuka"
                  type="time"
                  :disabled="readonly"
                  required
                />
                <FormInputText
                  name="onTimeUntil"
                  label="Tepat waktu sampai"
                  type="time"
                  hint="Setelah ini tercatat terlambat."
                  :disabled="readonly"
                  required
                />
                <FormInputText
                  name="closesAt"
                  label="Ditutup"
                  type="time"
                  :disabled="readonly"
                  required
                />
              </div>
              <div class="form-field">
                <span class="form-field__label">Hari sekolah</span>
                <SelectButton
                  v-model="workDays"
                  :options="WEEKDAYS"
                  option-label="short"
                  option-value="value"
                  multiple
                  :disabled="readonly"
                  aria-label="Hari sekolah"
                  class="wrap-select"
                />
                <small v-if="workDaysError" class="form-field__error">{{ workDaysError }}</small>
                <small v-else class="form-field__hint">
                  Hari libur nasional/sekolah diatur di menu Hari Libur. Di luar semester aktif
                  tidak ada presensi.
                </small>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>Lokasi (geofence)</template>
          <template #content>
            <div class="form-stack">
              <div class="form-field">
                <SelectButton
                  v-model="geofenceMode"
                  :options="GEOFENCE_MODES"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                  :disabled="readonly"
                  aria-label="Mode geofence"
                />
                <small class="form-field__hint">{{ modeHint }}</small>
              </div>
              <template v-if="geofenceMode !== 'off'">
                <MapPicker
                  ref="map"
                  v-model="point"
                  :radius="radius ?? null"
                  :disabled="readonly"
                  height="22rem"
                />
                <small class="form-field__hint"
                  >Klik peta untuk menandai titik pusat sekolah.</small
                >
                <div class="form-grid form-grid--3">
                  <div class="form-field">
                    <label class="form-field__label" for="geo-lat">Lintang</label>
                    <InputNumber
                      v-model="latitude"
                      input-id="geo-lat"
                      :min="-90"
                      :max="90"
                      :min-fraction-digits="0"
                      :max-fraction-digits="6"
                      :use-grouping="false"
                      locale="en-US"
                      :invalid="!!latitudeError"
                      :disabled="readonly"
                      fluid
                    />
                  </div>
                  <div class="form-field">
                    <label class="form-field__label" for="geo-lng">Bujur</label>
                    <InputNumber
                      v-model="longitude"
                      input-id="geo-lng"
                      :min="-180"
                      :max="180"
                      :min-fraction-digits="0"
                      :max-fraction-digits="6"
                      :use-grouping="false"
                      locale="en-US"
                      :invalid="!!latitudeError"
                      :disabled="readonly"
                      fluid
                    />
                  </div>
                  <FormInputNumber
                    name="geofenceRadiusM"
                    label="Radius (meter)"
                    :min="10"
                    :max="5000"
                    :step="10"
                    :disabled="readonly"
                    required
                  />
                </div>
                <small v-if="latitudeError" class="form-field__error" role="alert">{{
                  latitudeError
                }}</small>
                <div class="toolbar">
                  <Button
                    v-if="!readonly"
                    label="Gunakan lokasi saya"
                    icon="pi pi-map-marker"
                    size="small"
                    severity="secondary"
                    outlined
                    :loading="geo.locating.value"
                    @click="useMyLocation"
                  />
                  <a
                    v-if="mapsLink"
                    :href="mapsLink"
                    target="_blank"
                    rel="noopener"
                    class="link-strong"
                    >Buka di Google Maps <i class="pi pi-external-link" aria-hidden="true"
                  /></a>
                </div>
              </template>
              <FormInputNumber
                name="maxGpsAccuracyM"
                label="Akurasi GPS terburuk yang diterima (meter)"
                :min="10"
                :max="1000"
                hint="Presensi dengan akurasi lebih buruk dari ini ditolak bila geofence aktif."
                :disabled="readonly"
                required
              />
            </div>
          </template>
        </Card>
      </div>

      <div class="question-form__side form-stack">
        <Card>
          <template #title>Selfie</template>
          <template #content>
            <div class="form-stack">
              <FormSwitch
                name="requireSelfie"
                label="Selfie wajib"
                on-label="Wajib"
                off-label="Tidak wajib"
                :disabled="readonly"
              />
              <FormInputNumber
                name="selfieRetentionDays"
                label="Simpan foto selama (hari)"
                :min="7"
                :max="365"
                hint="Foto selfie dihapus otomatis setelah masa ini."
                :disabled="readonly"
                required
              />
            </div>
          </template>
        </Card>
        <Card>
          <template #title>Izin dan sakit</template>
          <template #content>
            <div class="form-stack">
              <FormSwitch
                name="leaveProofRequired"
                label="Bukti wajib"
                on-label="Wajib"
                off-label="Tidak wajib"
                :disabled="readonly"
              />
              <FormInputNumber
                name="leaveMaxDays"
                label="Lama izin maksimal (hari)"
                :min="1"
                :max="90"
                :disabled="readonly"
                required
              />
              <FormInputNumber
                name="leaveBackdateDays"
                label="Boleh diajukan mundur (hari)"
                :min="0"
                :max="30"
                hint="0 = hanya hari ini dan sesudahnya."
                :disabled="readonly"
                required
              />
            </div>
          </template>
        </Card>
        <p v-if="settings.updatedAt" class="text-muted">
          Terakhir diubah {{ formatDateTime(settings.updatedAt) }}
        </p>
      </div>
    </form>
  </div>
</template>
