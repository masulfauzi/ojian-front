<script setup>
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { usePolling } from '@/shared/composables/usePolling'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatDuration, formatZoned, formatZonedRange } from '@/shared/utils/zonedTime'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { ScheduleStateTags, getSchedule } from '@/modules/schedule'
import { addExtraTime, forceSubmit, getMonitor, voidAttempt } from '../api/proctor.api'
import TokenCard from '../components/TokenCard.vue'

const POLL_MS = 10_000

const STATES = {
  not_started: { label: 'Belum mulai', severity: 'secondary' },
  in_progress: { label: 'Mengerjakan', severity: 'info' },
  submitted: { label: 'Selesai', severity: 'success' },
}

const route = useRoute()
const router = useRouter()
const can = useCan('exam_monitor')
const canResults = useCan('exam_results')
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const linkQuery = computed(() => (school.scopeId.value ? { school_id: school.scopeId.value } : {}))

const schedule = ref(null)
const monitor = ref(null)
const loadError = ref(null)
const filter = ref('all')
const search = ref('')
/** Selisih jam server − jam perangkat (ms), agar sisa waktu tidak bergantung jam perangkat. */
const skew = ref(0)
const now = ref(Date.now())
const ticker = setInterval(() => (now.value = Date.now()), 1000)
onScopeDispose(() => clearInterval(ticker))

const items = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (monitor.value?.items ?? []).filter(
    (item) =>
      (filter.value === 'all' || item.state === filter.value) &&
      (!term ||
        item.name.toLowerCase().includes(term) ||
        (item.nis ?? '').toLowerCase().includes(term)),
  )
})
const filterOptions = computed(() => {
  const s = monitor.value?.summary ?? {}
  return [
    { value: 'all', label: `Semua (${s.total ?? 0})` },
    { value: 'not_started', label: `Belum mulai (${s.notStarted ?? 0})` },
    { value: 'in_progress', label: `Mengerjakan (${s.inProgress ?? 0})` },
    { value: 'submitted', label: `Selesai (${s.submitted ?? 0})` },
  ]
})
const progressPercent = computed(() => {
  const s = monitor.value?.summary
  return s?.total ? Math.round((s.submitted / s.total) * 100) : 0
})

const remaining = (item) =>
  item.deadlineAt
    ? Math.max(0, Math.floor((Date.parse(item.deadlineAt) - (now.value + skew.value)) / 1000))
    : null

async function loadMonitor() {
  const data = await getMonitor(route.params.id, scope())
  skew.value = Date.parse(data.serverTime) - Date.now()
  monitor.value = data
}

const polling = usePolling(async () => {
  try {
    await loadMonitor()
  } catch (error) {
    notify.error(error)
    throw error
  }
}, POLL_MS)

async function load() {
  loadError.value = null
  polling.stop()
  try {
    schedule.value = await getSchedule(route.params.id, scope())
    if (schedule.value.status !== 'published') {
      loadError.value = { message: 'Hanya jadwal yang sudah dipublikasikan yang bisa dipantau.' }
      return
    }
    await loadMonitor()
    polling.start({ immediate: false })
  } catch (error) {
    loadError.value = error
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && load(),
  { immediate: true },
)

// ---- Tindakan pengawas ----
const extraDialog = ref({ visible: false, item: null, minutes: 10, saving: false })
function openExtra(item) {
  extraDialog.value = { visible: true, item, minutes: 10, saving: false }
}
async function saveExtra() {
  const dialog = extraDialog.value
  dialog.saving = true
  try {
    await addExtraTime(dialog.item.attemptId, dialog.minutes, scope())
    notify.success(`${dialog.item.name} mendapat tambahan ${dialog.minutes} menit`)
    dialog.visible = false
    await polling.refresh()
  } catch (error) {
    notify.error(error)
  } finally {
    dialog.saving = false
  }
}

async function submitFor(item) {
  const ok = await ask({
    header: 'Kumpulkan paksa',
    message: `Pengerjaan ${item.name} diakhiri sekarang dan langsung dinilai. Jawaban yang sudah tersimpan tetap dihitung. Lanjutkan?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Kumpulkan',
    danger: true,
  })
  if (!ok) return
  try {
    await forceSubmit(item.attemptId, scope())
    notify.success(`Pengerjaan ${item.name} dikumpulkan`)
    await polling.refresh()
  } catch (error) {
    notify.error(error)
  }
}

const voidDialog = ref({ visible: false, item: null, reason: '', error: '', saving: false })
function openVoid(item) {
  voidDialog.value = { visible: true, item, reason: '', error: '', saving: false }
}
async function saveVoid() {
  const dialog = voidDialog.value
  if (dialog.reason.trim().length < 3) {
    dialog.error = 'Alasan minimal 3 karakter'
    return
  }
  dialog.saving = true
  try {
    await voidAttempt(dialog.item.attemptId, dialog.reason.trim(), scope())
    notify.success(`Pengerjaan ${dialog.item.name} direset; siswa bisa mulai lagi`)
    dialog.visible = false
    await polling.refresh()
  } catch (error) {
    dialog.error = error.fieldErrors?.reason ?? ''
    if (!dialog.error) notify.error(error)
  } finally {
    dialog.saving = false
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      :title="schedule?.title ?? 'Pemantauan ujian'"
      :description="
        schedule ? formatZonedRange(schedule.startsAt, schedule.endsAt, schedule.timezone) : ''
      "
    >
      <template #actions>
        <Button
          label="Daftar jadwal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'monitors', query: linkQuery })"
        />
        <Button
          v-if="schedule && canResults.view"
          label="Hasil"
          icon="pi pi-chart-bar"
          severity="secondary"
          outlined
          @click="router.push({ name: 'result', params: { id: schedule.id }, query: linkQuery })"
        />
        <Button
          v-if="monitor"
          v-tooltip.bottom="`Diperbarui otomatis tiap ${POLL_MS / 1000} detik`"
          label="Muat ulang"
          icon="pi pi-refresh"
          :loading="polling.running.value"
          @click="polling.refresh()"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Jadwal tidak dapat dipantau"
      :description="loadError.message"
    />
    <div v-else-if="!monitor && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <div v-else-if="monitor" class="question-form">
      <div class="question-form__main form-stack">
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-card__label">Peserta</span>
            <span class="stat-card__value">{{ monitor.summary.total }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">Belum mulai</span>
            <span class="stat-card__value">{{ monitor.summary.notStarted }}</span>
          </div>
          <div class="stat-card stat-card--info">
            <span class="stat-card__label">Mengerjakan</span>
            <span class="stat-card__value">{{ monitor.summary.inProgress }}</span>
          </div>
          <div class="stat-card stat-card--success">
            <span class="stat-card__label">Selesai</span>
            <span class="stat-card__value">{{ monitor.summary.submitted }}</span>
          </div>
        </div>
        <ProgressBar :value="progressPercent" class="monitor-progress">
          {{ progressPercent }}% selesai
        </ProgressBar>

        <Card>
          <template #content>
            <div class="form-stack">
              <div class="toolbar">
                <IconField class="toolbar__search">
                  <InputIcon class="pi pi-search" />
                  <InputText
                    v-model="search"
                    placeholder="Cari nama atau NIS"
                    aria-label="Cari peserta"
                    fluid
                  />
                </IconField>
                <SelectButton
                  v-model="filter"
                  :options="filterOptions"
                  option-label="label"
                  option-value="value"
                  :allow-empty="false"
                  aria-label="Filter keadaan peserta"
                  class="monitor-filter"
                />
              </div>
              <DataTable :value="items" data-key="studentId" size="small" striped-rows>
                <template #empty>
                  <EmptyState icon="pi pi-users" title="Tidak ada peserta yang cocok" />
                </template>
                <Column header="Siswa">
                  <template #body="{ data }">
                    {{ data.name }}
                    <div class="text-muted">{{ data.nis }} · {{ data.className ?? '-' }}</div>
                  </template>
                </Column>
                <Column header="Keadaan">
                  <template #body="{ data }">
                    <Tag
                      :value="STATES[data.state]?.label ?? data.state"
                      :severity="STATES[data.state]?.severity"
                    />
                    <div v-if="data.attemptNo > 1" class="text-muted">
                      Pengerjaan ke-{{ data.attemptNo }}
                    </div>
                  </template>
                </Column>
                <Column header="Terjawab">
                  <template #body="{ data }">
                    <span v-if="data.state === 'not_started'" class="text-muted">-</span>
                    <template v-else>
                      {{ data.answered }}/{{ monitor.questionCount }}
                      <ProgressBar
                        :value="
                          monitor.questionCount
                            ? Math.round((data.answered / monitor.questionCount) * 100)
                            : 0
                        "
                        :show-value="false"
                        class="row-progress"
                      />
                    </template>
                  </template>
                </Column>
                <Column header="Waktu">
                  <template #body="{ data }">
                    <template v-if="data.state === 'in_progress'">
                      <strong :class="{ 'text-danger': remaining(data) < 300 }"
                        >sisa {{ formatDuration(remaining(data)) }}</strong
                      >
                      <div class="text-muted">
                        mulai
                        {{ formatZoned(data.startedAt, schedule.timezone, { withDate: false }) }}
                      </div>
                    </template>
                    <span v-else-if="data.state === 'submitted'" class="text-muted">
                      selesai
                      {{ formatZoned(data.submittedAt, schedule.timezone, { withDate: false }) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                    <div v-if="data.extraTimeMinutes" class="text-muted">
                      +{{ data.extraTimeMinutes }} menit
                    </div>
                  </template>
                </Column>
                <Column v-if="can.update" header="Tindakan">
                  <template #body="{ data }">
                    <div v-if="data.attemptId" class="row-actions">
                      <Button
                        v-if="data.state === 'in_progress'"
                        v-tooltip.top="'Tambah waktu'"
                        icon="pi pi-stopwatch"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        :aria-label="`Tambah waktu ${data.name}`"
                        @click="openExtra(data)"
                      />
                      <Button
                        v-if="data.state === 'in_progress'"
                        v-tooltip.top="'Kumpulkan paksa'"
                        icon="pi pi-send"
                        severity="warn"
                        text
                        rounded
                        size="small"
                        :aria-label="`Kumpulkan paksa ${data.name}`"
                        @click="submitFor(data)"
                      />
                      <Button
                        v-tooltip.top="'Reset pengerjaan'"
                        icon="pi pi-replay"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        :aria-label="`Reset pengerjaan ${data.name}`"
                        @click="openVoid(data)"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </Card>
      </div>

      <div class="question-form__side form-stack">
        <TokenCard
          v-if="schedule.tokenEnabled"
          :schedule-id="schedule.id"
          :school-id="school.scopeId.value"
          :can-regenerate="can.update"
        />
        <Card>
          <template #title>Jadwal</template>
          <template #content>
            <div class="form-stack">
              <ScheduleStateTags :schedule="{ ...schedule, timeState: monitor.timeState }" />
              <dl class="detail-list">
                <dt>Paket</dt>
                <dd>{{ schedule.examTitle }}</dd>
                <dt>Soal</dt>
                <dd>{{ monitor.questionCount }}</dd>
                <dt>Durasi</dt>
                <dd>{{ schedule.durationMinutes }} menit</dd>
                <dt>Token</dt>
                <dd>{{ schedule.tokenEnabled ? 'Wajib' : 'Tidak memakai token' }}</dd>
              </dl>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Dialog
      v-model:visible="extraDialog.visible"
      :header="`Tambah waktu: ${extraDialog.item?.name ?? ''}`"
      :style="{ width: 'min(24rem, calc(100vw - 2rem))' }"
      modal
    >
      <div class="form-field">
        <label class="form-field__label" for="extra-minutes">Tambahan (menit)</label>
        <InputNumber
          v-model="extraDialog.minutes"
          input-id="extra-minutes"
          :min="1"
          :max="600"
          show-buttons
          fluid
        />
        <small class="form-field__hint">Batas waktu siswa langsung diperbarui.</small>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button
            label="Batal"
            severity="secondary"
            outlined
            @click="extraDialog.visible = false"
          />
          <Button
            label="Tambah waktu"
            icon="pi pi-check"
            :disabled="!extraDialog.minutes"
            :loading="extraDialog.saving"
            @click="saveExtra"
          />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="voidDialog.visible"
      :header="`Reset pengerjaan: ${voidDialog.item?.name ?? ''}`"
      :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
      modal
    >
      <div class="form-stack">
        <p class="text-muted">
          Pengerjaan ini dibatalkan (jawaban tetap tersimpan untuk audit) dan siswa mendapat satu
          kesempatan tambahan untuk mulai dari awal.
        </p>
        <div class="form-field">
          <label class="form-field__label" for="void-reason">Alasan</label>
          <Textarea
            id="void-reason"
            v-model="voidDialog.reason"
            rows="2"
            maxlength="500"
            placeholder="Mis. listrik padam, perangkat rusak"
            :invalid="!!voidDialog.error"
            fluid
          />
          <small v-if="voidDialog.error" class="form-field__error" role="alert">{{
            voidDialog.error
          }}</small>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="Batal" severity="secondary" outlined @click="voidDialog.visible = false" />
          <Button
            label="Reset pengerjaan"
            icon="pi pi-replay"
            severity="danger"
            :loading="voidDialog.saving"
            @click="saveVoid"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
