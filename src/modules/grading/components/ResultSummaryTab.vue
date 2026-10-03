<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import { downloadCsv } from '@/shared/utils/download'
import { formatNumber } from '@/shared/utils/format'
import { formatZoned } from '@/shared/utils/zonedTime'
import { gradingStatusOf } from '../api/grading.api'
import { RESULT_COLUMNS, resultRows } from '../utils/rubric'

// Rekap nilai per siswa sesuai score_policy jadwal.
const props = defineProps({
  schedule: { type: Object, required: true },
  results: { type: Object, required: true },
})

const search = ref('')
const items = computed(() => {
  const term = search.value.trim().toLowerCase()
  return props.results.items.filter(
    (item) =>
      !term ||
      item.name.toLowerCase().includes(term) ||
      (item.nis ?? '').toLowerCase().includes(term),
  )
})
const summary = computed(() => props.results.summary)

function exportCsv() {
  const name = props.schedule.title.replace(/[^\w-]+/g, '_').slice(0, 60)
  downloadCsv(
    resultRows(props.results.items, (s) => gradingStatusOf(s).label),
    RESULT_COLUMNS,
    `nilai_${name}.csv`,
  )
}

const percent = (value) =>
  value === null ? '-' : formatNumber(value, { maximumFractionDigits: 1 })
</script>

<template>
  <div class="form-stack">
    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-card__label">Peserta</span>
        <span class="stat-card__value">{{ summary.participants }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Mengumpulkan</span>
        <span class="stat-card__value">{{ summary.submitted }}</span>
      </div>
      <div class="stat-card stat-card--info">
        <span class="stat-card__label">Rata-rata</span>
        <span class="stat-card__value">{{ percent(summary.averagePercent) }}</span>
      </div>
      <div class="stat-card stat-card--success">
        <span class="stat-card__label">Lulus KKM {{ results.passingScore ?? '-' }}</span>
        <span class="stat-card__value">{{ summary.passed }}</span>
      </div>
    </div>
    <Message v-if="summary.pendingGrading" severity="warn" :closable="false">
      {{ summary.pendingGrading }} pengerjaan masih menunggu penilaian manual; nilainya belum final.
      Buka tab <strong>Penilaian</strong>.
    </Message>

    <div class="toolbar">
      <IconField class="toolbar__search">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="search"
          placeholder="Cari nama atau NIS"
          aria-label="Cari siswa"
          fluid
        />
      </IconField>
      <Button
        label="Unduh CSV"
        icon="pi pi-download"
        severity="secondary"
        outlined
        :disabled="!results.items.length"
        @click="exportCsv"
      />
    </div>
    <DataTable
      :value="items"
      data-key="studentId"
      size="small"
      striped-rows
      sort-mode="single"
      paginator
      :rows="25"
      :always-show-paginator="false"
    >
      <template #empty>
        <EmptyState
          icon="pi pi-chart-bar"
          title="Belum ada hasil"
          description="Nilai muncul setelah siswa mengumpulkan pengerjaan."
        />
      </template>
      <Column field="name" header="Siswa" sortable>
        <template #body="{ data }">
          {{ data.name }}
          <div class="text-muted">{{ data.nis }}</div>
        </template>
      </Column>
      <Column field="className" header="Kelas" sortable />
      <Column field="scorePercent" header="Nilai" sortable>
        <template #body="{ data }">
          <strong>{{ percent(data.scorePercent) }}</strong>
          <div v-if="data.totalScore !== null" class="text-muted">
            {{ formatNumber(data.totalScore) }}/{{ formatNumber(data.maxScore) }} poin
          </div>
        </template>
      </Column>
      <Column header="Kelulusan">
        <template #body="{ data }">
          <Tag
            v-if="data.passed !== null"
            :value="data.passed ? 'Lulus' : 'Belum lulus'"
            :severity="data.passed ? 'success' : 'danger'"
          />
          <span v-else class="text-muted">-</span>
        </template>
      </Column>
      <Column header="Penilaian">
        <template #body="{ data }">
          <Tag
            v-if="data.attemptId"
            :value="gradingStatusOf(data.gradingStatus).label"
            :severity="gradingStatusOf(data.gradingStatus).severity"
          />
          <span v-else class="text-muted">Belum mengerjakan</span>
        </template>
      </Column>
      <Column header="Dikumpulkan">
        <template #body="{ data }">
          <span class="text-muted">{{
            data.submittedAt ? formatZoned(data.submittedAt, schedule.timezone) : '-'
          }}</span>
          <div v-if="data.attemptNo > 1" class="text-muted">pengerjaan ke-{{ data.attemptNo }}</div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
