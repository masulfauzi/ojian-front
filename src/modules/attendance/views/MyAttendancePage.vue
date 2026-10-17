<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDate } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import { checkIn, getMyMonthly, getToday } from '../api/attendance.api'
import CheckInPanel from '../components/CheckInPanel.vue'
import MonthCalendar from '../components/MonthCalendar.vue'
import MonthSummary from '../components/MonthSummary.vue'
import { SOURCE_LABELS, TODAY_STATES, attendanceStatusOf, leaveTypeLabel } from '../constants'
import { wallTime } from '../utils/calendar'
import { STATE_CODES } from '../utils/errors'

const router = useRouter()
const notify = useNotify()
const can = useCan('my_attendance')
const canLeaves = useCan('my_leaves')

const today = ref(null)
const loadError = ref(null)
const result = ref(null)
const month = ref('')
const monthly = ref(null)
const loadingMonth = ref(false)

const state = computed(() => TODAY_STATES[today.value?.state] ?? null)
const record = computed(() => today.value?.record ?? null)
const recordStatus = computed(() => attendanceStatusOf(record.value?.status))

async function loadToday() {
  loadError.value = null
  try {
    today.value = await getToday()
    if (!month.value) month.value = today.value.date.slice(0, 7)
  } catch (error) {
    loadError.value = error
  }
}

async function loadMonth() {
  if (!month.value) return
  loadingMonth.value = true
  try {
    monthly.value = await getMyMonthly(month.value)
  } catch (error) {
    notify.error(error)
  } finally {
    loadingMonth.value = false
  }
}

watch(month, loadMonth)
onMounted(loadToday)

async function submit(payload) {
  try {
    result.value = await checkIn(payload)
  } catch (error) {
    // Keadaan hari ini berubah (mis. jam presensi baru saja ditutup): muat ulang kartu.
    if (STATE_CODES.includes(error.code)) await loadToday()
    throw error
  }
  notify.success(
    result.value.alreadyCheckedIn
      ? 'Anda sudah presensi hari ini'
      : result.value.status === 'late'
        ? `Presensi tercatat: terlambat ${result.value.lateMinutes} menit`
        : 'Presensi tercatat: hadir tepat waktu',
  )
  await Promise.all([loadToday(), loadMonth()])
}
</script>

<template>
  <div class="page attendance-page">
    <PageHeader title="Presensi Saya" description="Presensi selfie sekali setiap pagi hari sekolah">
      <template #actions>
        <Button
          v-if="canLeaves.create"
          label="Ajukan izin"
          icon="pi pi-file"
          severity="secondary"
          outlined
          @click="router.push({ name: 'my-leaves', query: { new: '1' } })"
        />
      </template>
    </PageHeader>

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Presensi tidak dapat dimuat"
      :description="loadError.message"
    >
      <Button label="Coba lagi" icon="pi pi-refresh" @click="loadToday" />
    </EmptyState>
    <div v-else-if="!today" class="center-block"><ProgressSpinner style="width: 3rem" /></div>

    <div v-else class="attendance-layout">
      <Card class="today-card">
        <template #title>
          <div class="today-card__head">
            <span>{{
              formatDate(today.date, { weekday: 'long', day: 'numeric', month: 'long' })
            }}</span>
            <Tag v-if="state" :value="state.label" :severity="state.severity" :icon="state.icon" />
          </div>
        </template>
        <template #subtitle>
          <span v-if="today.isSchoolDay">
            Dibuka {{ today.window.opensAt }} · tepat waktu sampai {{ today.window.onTimeUntil }} ·
            ditutup {{ today.window.closesAt }}
          </span>
        </template>
        <template #content>
          <div class="form-stack">
            <Message v-if="today.leave" severity="info" :closable="false" icon="pi pi-file">
              Anda tercatat
              <strong>{{ leaveTypeLabel(today.leave.leaveType).toLowerCase() }}</strong> ({{
                formatDate(today.leave.startDate)
              }}–{{ formatDate(today.leave.endDate) }}).
              <template v-if="today.state === 'open'"
                >Bila ternyata masuk sekolah, Anda tetap bisa presensi.</template
              >
            </Message>

            <div v-if="today.state === 'done' && record" class="today-done">
              <i class="pi pi-check-circle today-done__icon" aria-hidden="true" />
              <div>
                <Tag :value="recordStatus.label" :severity="recordStatus.severity" />
                <p class="today-done__time">
                  Pukul {{ wallTime(record.checkedInAt) }}
                  <span v-if="record.lateMinutes"> · terlambat {{ record.lateMinutes }} menit</span>
                </p>
                <p class="text-muted">
                  {{ SOURCE_LABELS[record.source] ?? record.source }}
                  <span v-if="record.withinGeofence === false"> · di luar area sekolah</span>
                </p>
              </div>
            </div>

            <CheckInPanel
              v-else-if="today.state === 'open' && can.create"
              :require-selfie="today.requireSelfie"
              :geofence-mode="today.geofenceMode"
              :submit="submit"
            />

            <EmptyState
              v-else-if="today.state === 'not_open'"
              icon="pi pi-clock"
              title="Presensi belum dibuka"
              :description="`Presensi dibuka pukul ${today.window.opensAt}.`"
            >
              <Button label="Muat ulang" icon="pi pi-refresh" text @click="loadToday" />
            </EmptyState>
            <EmptyState
              v-else-if="today.state === 'closed'"
              icon="pi pi-lock"
              title="Presensi hari ini sudah ditutup"
              :description="
                record?.status
                  ? `Status hari ini: ${recordStatus.label}.`
                  : `Presensi ditutup pukul ${today.window.closesAt}. Hubungi admin presensi bila ada kendala.`
              "
            />
            <EmptyState
              v-else-if="today.state === 'not_school_day'"
              icon="pi pi-calendar-times"
              title="Hari ini bukan hari sekolah"
              description="Tidak perlu presensi."
            />
          </div>
        </template>
      </Card>

      <Card class="month-card">
        <template #title>Rekap bulanan</template>
        <template #content>
          <div class="form-stack">
            <MonthSummary v-if="monthly" :summary="monthly.summary" />
            <MonthCalendar
              v-if="month"
              v-model:month="month"
              :days="monthly?.days ?? []"
              :today="today.date"
              :max-month="today.date.slice(0, 7)"
              :loading="loadingMonth"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
