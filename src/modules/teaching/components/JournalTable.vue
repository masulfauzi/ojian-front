<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import EmptyState from '@/shared/components/EmptyState.vue'
import { formatDate } from '@/shared/utils/format'
import { periodLabel } from '../utils/timetable'

// Daftar jurnal (guru: miliknya; admin: semua guru). Aksi per baris lewat slot `actions`.
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  rows: { type: Number, default: 50 },
  first: { type: Number, default: 0 },
  showTeacher: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'Belum ada jurnal' },
  emptyDescription: { type: String, default: '' },
})
const emit = defineEmits(['page'])

const attendanceText = (a) =>
  a ? `${a.present + a.late}/${a.total} hadir` + (a.notYet ? ` · ${a.notYet} belum` : '') : '-'
</script>

<template>
  <DataTable
    :value="items"
    :loading="loading"
    :total-records="total"
    :rows="rows"
    :first="first"
    data-key="id"
    lazy
    paginator
    :always-show-paginator="false"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    current-page-report-template="{first}–{last} dari {totalRecords} jurnal"
    striped-rows
    @page="(event) => emit('page', event.page + 1)"
  >
    <template #empty>
      <EmptyState icon="pi pi-book" :title="emptyTitle" :description="emptyDescription" />
    </template>
    <Column header="Tanggal">
      <template #body="{ data }">
        {{ formatDate(data.journalDate, { day: 'numeric', month: 'short', year: 'numeric' }) }}
        <div class="text-muted">
          {{ data.dayName }} · jam {{ periodLabel(data.periodFrom, data.periodTo) }}
        </div>
      </template>
    </Column>
    <Column v-if="showTeacher" header="Guru">
      <template #body="{ data }">{{ data.teacher?.name ?? '-' }}</template>
    </Column>
    <Column header="Kelas & mapel">
      <template #body="{ data }">
        {{ data.class?.name }}
        <div class="text-muted">{{ data.subject?.name }}</div>
      </template>
    </Column>
    <Column header="Materi">
      <template #body="{ data }">
        <span class="question-cell__text">{{ data.topic }}</span>
        <div v-if="data.notes" class="text-muted question-cell__text">{{ data.notes }}</div>
      </template>
    </Column>
    <Column header="Kehadiran">
      <template #body="{ data }"
        ><span class="text-muted">{{ attendanceText(data.attendance) }}</span></template
      >
    </Column>
    <Column header="">
      <template #body="{ data }">
        <div class="row-actions">
          <i
            v-if="!data.editable"
            v-tooltip.top="'Terkunci (di luar batas waktu ubah)'"
            class="pi pi-lock text-muted"
            aria-label="Terkunci"
          />
          <slot name="actions" :journal="data" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
