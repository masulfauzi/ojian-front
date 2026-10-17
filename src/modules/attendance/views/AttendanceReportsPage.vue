<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import BaseChart from '@/shared/components/BaseChart.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { monthKey, monthLabel, shiftMonth } from '@/shared/utils/date'
import { downloadCsv } from '@/shared/utils/download'
import { formatDate } from '@/shared/utils/format'
import { useAuthStore } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { getClassReport, getStudentReport, getSummaryToday } from '../api/attendance.api'
import MonthCalendar from '../components/MonthCalendar.vue'
import MonthSummary from '../components/MonthSummary.vue'
import { useClassOptions } from '../composables/useClassOptions'
import { ATTENDANCE_STATUSES } from '../constants'
import { percentText } from '../utils/calendar'
import { CLASS_REPORT_COLUMNS, classReportRows, summaryTotals } from '../utils/reports'

const auth = useAuthStore()
const notify = useNotify()

const { query, update } = useQueryState({
  school_id: { type: 'string' },
  tab: { type: 'string', options: ['today', 'class'] },
  class_id: { type: 'string' },
  month: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
// Guru tanpa hak data presensi hanya melihat kelas perwaliannya.
const homeroomOnly = computed(() => !auth.can('attendance_records'))
const classes = useClassOptions(school, { homeroomOnly: () => homeroomOnly.value })

const tab = computed({
  get: () => query.value.tab || 'today',
  set: (value) => update({ tab: value === 'today' ? '' : value }),
})
const currentMonth = monthKey()
const month = computed({
  get: () => (/^\d{4}-\d{2}$/.test(query.value.month) ? query.value.month : currentMonth),
  set: (value) => update({ month: value === currentMonth ? '' : value }),
})

// ---- Hari ini ----
const summary = ref(null)
const loadingSummary = ref(false)
async function loadSummary() {
  loadingSummary.value = true
  try {
    summary.value = await getSummaryToday(scope())
  } catch (error) {
    notify.error(error)
  } finally {
    loadingSummary.value = false
  }
}
watch(
  () => [school.ready.value, school.scopeId.value],
  ([ready]) => ready && loadSummary(),
  { immediate: true },
)
const totals = computed(() => summaryTotals(summary.value?.classes ?? []))
const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  excused: '#3b82f6',
  sick: '#8b5cf6',
  absent: '#ef4444',
  notYet: '#94a3b8',
}
const chartData = computed(() => {
  const rows = summary.value?.classes ?? []
  const series = [
    ...ATTENDANCE_STATUSES.map((s) => [s.value, s.label]),
    ['notYet', 'Belum presensi'],
  ]
  return {
    labels: rows.map((c) => c.className),
    datasets: series.map(([key, label]) => ({
      label,
      data: rows.map((c) => c[key]),
      backgroundColor: COLORS[key],
      stack: 'total',
    })),
  }
})
const chartOptions = {
  plugins: { legend: { position: 'bottom' } },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
  },
}

// ---- Rekap kelas ----
const report = ref(null)
const loadingReport = ref(false)
const reportError = ref(null)
const classId = computed(() => query.value.class_id || classes.options.value[0]?.value || null)

async function loadReport() {
  if (!classId.value) return
  loadingReport.value = true
  reportError.value = null
  try {
    report.value = await getClassReport(classId.value, month.value, scope())
  } catch (error) {
    report.value = null
    reportError.value = error
  } finally {
    loadingReport.value = false
  }
}
watch(
  () => [tab.value, classId.value, month.value, school.scopeId.value],
  () => tab.value === 'class' && loadReport(),
  { immediate: true },
)

function exportCsv() {
  downloadCsv(
    classReportRows(report.value.students),
    CLASS_REPORT_COLUMNS,
    `presensi_${report.value.className}_${report.value.month}.csv`.replace(/\s+/g, '_'),
  )
}

// ---- Rekap siswa ----
const student = ref({
  visible: false,
  item: null,
  month: '',
  loadedMonth: '',
  data: null,
  loading: false,
})
async function loadStudent() {
  const s = student.value
  s.loadedMonth = s.month
  s.loading = true
  try {
    s.data = await getStudentReport(s.item.studentId, s.month, scope())
  } catch (error) {
    notify.error(error)
  } finally {
    s.loading = false
  }
}
function openStudent(item) {
  student.value = {
    visible: true,
    item,
    month: month.value,
    loadedMonth: '',
    data: null,
    loading: false,
  }
  loadStudent()
}
watch(
  () => student.value.month,
  (value) => student.value.visible && value !== student.value.loadedMonth && loadStudent(),
)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Rekap Presensi"
      :description="
        homeroomOnly
          ? 'Presensi kelas perwalian Anda'
          : 'Ringkasan harian dan rekap bulanan per kelas'
      "
    />

    <SchoolContextBar :context="school" />

    <Tabs v-if="school.ready.value" v-model:value="tab">
      <TabList>
        <Tab value="today"><i class="pi pi-sun" aria-hidden="true" /> Hari ini</Tab>
        <Tab value="class"><i class="pi pi-table" aria-hidden="true" /> Rekap kelas</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="today">
          <div class="form-stack">
            <div class="toolbar">
              <strong v-if="summary">{{
                formatDate(summary.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              }}</strong>
              <Button
                label="Muat ulang"
                icon="pi pi-refresh"
                size="small"
                severity="secondary"
                text
                :loading="loadingSummary"
                @click="loadSummary"
              />
            </div>
            <div v-if="!summary && loadingSummary" class="center-block">
              <ProgressSpinner style="width: 2.5rem" />
            </div>
            <EmptyState
              v-else-if="summary && !summary.isSchoolDay"
              icon="pi pi-calendar-times"
              title="Hari ini bukan hari sekolah"
            />
            <template v-else-if="summary">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-card__label">Siswa</span>
                  <span class="stat-card__value">{{ totals.total }}</span>
                </div>
                <div class="stat-card stat-card--success">
                  <span class="stat-card__label">Hadir + terlambat</span>
                  <span class="stat-card__value">{{ totals.present + totals.late }}</span>
                </div>
                <div class="stat-card stat-card--info">
                  <span class="stat-card__label">Izin / sakit</span>
                  <span class="stat-card__value">{{ totals.excused + totals.sick }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-card__label">Belum presensi</span>
                  <span class="stat-card__value">{{ totals.notYet }}</span>
                </div>
                <div class="stat-card stat-card--danger">
                  <span class="stat-card__label">Alpa</span>
                  <span class="stat-card__value">{{ totals.absent }}</span>
                </div>
              </div>
              <Card v-if="summary.classes.length > 1">
                <template #content>
                  <BaseChart type="bar" :data="chartData" :options="chartOptions" height="16rem" />
                </template>
              </Card>
              <Card>
                <template #content>
                  <DataTable :value="summary.classes" data-key="classId" size="small" striped-rows>
                    <template #empty>
                      <EmptyState icon="pi pi-sitemap" title="Tidak ada kelas" />
                    </template>
                    <Column field="className" header="Kelas" />
                    <Column field="total" header="Siswa" />
                    <Column field="present" header="Hadir" />
                    <Column field="late" header="Terlambat" />
                    <Column field="excused" header="Izin" />
                    <Column field="sick" header="Sakit" />
                    <Column field="absent" header="Alpa" />
                    <Column field="notYet" header="Belum" />
                  </DataTable>
                </template>
              </Card>
            </template>
          </div>
        </TabPanel>

        <TabPanel value="class">
          <div class="form-stack">
            <div class="toolbar">
              <Select
                class="toolbar__filter"
                :model-value="classId"
                :options="classes.options.value"
                option-label="label"
                option-value="value"
                placeholder="Pilih kelas"
                aria-label="Kelas"
                filter
                :loading="classes.loading.value"
                @update:model-value="(value) => update({ class_id: value ?? '' })"
              />
              <div class="month-switch">
                <Button
                  icon="pi pi-angle-left"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Bulan sebelumnya"
                  @click="month = shiftMonth(month, -1)"
                />
                <strong>{{ monthLabel(month) }}</strong>
                <Button
                  icon="pi pi-angle-right"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Bulan berikutnya"
                  :disabled="month >= currentMonth"
                  @click="month = shiftMonth(month, 1)"
                />
              </div>
              <Button
                label="Unduh CSV"
                icon="pi pi-download"
                severity="secondary"
                outlined
                :disabled="!report?.students.length"
                @click="exportCsv"
              />
            </div>
            <EmptyState
              v-if="!classes.loading.value && !classes.options.value.length"
              icon="pi pi-sitemap"
              :title="homeroomOnly ? 'Anda belum menjadi wali kelas' : 'Belum ada kelas'"
              :description="
                homeroomOnly ? 'Rekap kelas hanya tersedia untuk kelas perwalian Anda.' : ''
              "
            />
            <Message v-else-if="reportError" severity="error" :closable="false">{{
              reportError.message
            }}</Message>
            <Card v-else>
              <template #content>
                <DataTable
                  :value="report?.students ?? []"
                  :loading="loadingReport"
                  data-key="studentId"
                  size="small"
                  striped-rows
                  row-hover
                  sort-mode="single"
                  class="clickable-rows"
                  @row-click="(event) => openStudent(event.data)"
                >
                  <template #empty>
                    <EmptyState icon="pi pi-users" title="Tidak ada siswa di kelas ini" />
                  </template>
                  <Column field="name" header="Siswa" sortable>
                    <template #body="{ data }">
                      {{ data.name }}
                      <div class="text-muted">{{ data.nis }}</div>
                    </template>
                  </Column>
                  <Column field="attendancePercent" header="Kehadiran" sortable>
                    <template #body="{ data }"
                      ><strong>{{ percentText(data.attendancePercent) }}</strong></template
                    >
                  </Column>
                  <Column field="present" header="Hadir" sortable />
                  <Column field="late" header="Terlambat" sortable />
                  <Column field="excused" header="Izin" sortable />
                  <Column field="sick" header="Sakit" sortable />
                  <Column field="absent" header="Alpa" sortable />
                  <Column field="schoolDays" header="Hari sekolah" />
                </DataTable>
              </template>
            </Card>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Dialog
      v-model:visible="student.visible"
      :header="student.item?.name ?? 'Rekap siswa'"
      :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
      modal
    >
      <div class="form-stack">
        <p v-if="student.data?.student" class="text-muted">
          {{ student.data.student.nis }} · {{ student.data.student.className ?? '-' }}
        </p>
        <MonthSummary v-if="student.data" :summary="student.data.summary" />
        <MonthCalendar
          v-if="student.month"
          v-model:month="student.month"
          :days="student.data?.days ?? []"
          :max-month="currentMonth"
          :loading="student.loading"
        />
      </div>
    </Dialog>
  </div>
</template>
