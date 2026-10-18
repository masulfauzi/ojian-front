<script setup>
import { ref, watch } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDate } from '@/shared/utils/format'
import { ATTENDANCE_STATUSES, attendanceStatusOf, wallTime } from '@/modules/attendance'
import { getJournalStudents } from '../api/journal.api'
import { periodLabel } from '../utils/timetable'

// Siswa kelas pada jurnal beserta status presensi PAGI di tanggal itu.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  journal: { type: Object, default: null },
  schoolId: { type: String, default: null },
})
const notify = useNotify()

const data = ref(null)
const loading = ref(false)

watch(visible, async (open) => {
  if (!open || !props.journal) return
  data.value = null
  loading.value = true
  try {
    data.value = await getJournalStudents(props.journal.id, { schoolId: props.schoolId })
  } catch (error) {
    notify.error(error)
    visible.value = false
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="journal ? `${journal.class?.name} · ${journal.subject?.name}` : 'Siswa'"
    :style="{ width: 'min(40rem, calc(100vw - 2rem))' }"
    modal
  >
    <div v-if="journal" class="form-stack">
      <p class="text-muted">
        {{ journal.dayName }}, {{ formatDate(journal.journalDate) }} · jam
        {{ periodLabel(journal.periodFrom, journal.periodTo) }} · {{ journal.topic }}
      </p>
      <Message severity="secondary" :closable="false" icon="pi pi-info-circle">
        Status diambil dari presensi pagi pada tanggal ini, bukan kehadiran per jam pelajaran.
      </Message>
      <div v-if="loading" class="center-block"><ProgressSpinner style="width: 2.5rem" /></div>
      <template v-else-if="data">
        <ul class="plain-list attendance-chips">
          <li v-for="s in ATTENDANCE_STATUSES" :key="s.value">
            <Tag :value="`${s.label} ${data.summary?.[s.value] ?? 0}`" :severity="s.severity" />
          </li>
          <li v-if="data.summary?.notYet">
            <Tag :value="`Belum presensi ${data.summary.notYet}`" severity="secondary" />
          </li>
        </ul>
        <DataTable :value="data.students" data-key="studentId" size="small" striped-rows>
          <Column header="Siswa">
            <template #body="{ data: s }">
              {{ s.name }}
              <div class="text-muted">{{ s.nis }}</div>
            </template>
          </Column>
          <Column header="Status">
            <template #body="{ data: s }">
              <Tag
                :value="attendanceStatusOf(s.status).label"
                :severity="attendanceStatusOf(s.status).severity"
              />
              <span v-if="s.lateMinutes" class="text-muted"> {{ s.lateMinutes }} mnt</span>
            </template>
          </Column>
          <Column header="Jam presensi">
            <template #body="{ data: s }">{{ wallTime(s.checkedInAt) }}</template>
          </Column>
        </DataTable>
      </template>
    </div>
  </Dialog>
</template>
