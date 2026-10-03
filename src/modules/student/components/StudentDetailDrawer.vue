<script setup>
import { ref, watch } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Drawer from 'primevue/drawer'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusTag from '@/shared/components/StatusTag.vue'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import { GENDER_OPTIONS, statusOf } from '../constants'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  studentId: { type: String, default: null },
  /** async (id) => { student, history } */
  load: { type: Function, required: true },
})

const student = ref(null)
const history = ref([])
const loading = ref(false)
const error = ref(null)

watch(visible, async (open) => {
  if (!open || !props.studentId) return
  loading.value = true
  error.value = null
  try {
    const result = await props.load(props.studentId)
    student.value = result.student
    history.value = result.history
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})

const genderLabel = (value) => GENDER_OPTIONS.find((g) => g.value === value)?.label ?? '-'
</script>

<template>
  <Drawer v-model:visible="visible" header="Detail siswa" position="right" class="student-drawer">
    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 2.5rem" /></div>
    <EmptyState
      v-else-if="error"
      icon="pi pi-exclamation-circle"
      title="Gagal memuat"
      :description="error.message"
    />
    <div v-else-if="student" class="form-stack">
      <div>
        <h2 class="student-drawer__name">{{ student.name }}</h2>
        <div class="tag-list">
          <Tag
            :value="statusOf(student.status).label"
            :severity="statusOf(student.status).severity"
          />
          <StatusTag
            :active="student.accountActive"
            active-label="Akun aktif"
            inactive-label="Akun nonaktif"
          />
        </div>
      </div>
      <dl class="detail-list">
        <dt>NISN / username</dt>
        <dd>{{ student.nisn || '-' }}</dd>
        <dt>NIS</dt>
        <dd>{{ student.nis }}</dd>
        <dt>Kelas aktif</dt>
        <dd>{{ student.class?.name ?? 'Belum ada' }}</dd>
        <dt>Jenis kelamin</dt>
        <dd>{{ genderLabel(student.gender) }}</dd>
        <dt>Tempat, tgl lahir</dt>
        <dd>{{ student.birthPlace || '-' }}, {{ formatDate(student.birthDate) }}</dd>
        <dt>Tanggal masuk</dt>
        <dd>{{ formatDate(student.admissionDate) }}</dd>
        <dt>Email</dt>
        <dd>{{ student.email || '-' }}</dd>
        <template v-if="student.status !== 'active'">
          <dt>Status sejak</dt>
          <dd>{{ formatDateTime(student.statusChangedAt) }}</dd>
        </template>
      </dl>
      <h3 class="form-section-title">Riwayat kelas</h3>
      <DataTable :value="history" size="small">
        <template #empty
          ><span class="text-muted">Belum pernah ditempatkan di kelas.</span></template
        >
        <Column header="Semester">
          <template #body="{ data }">{{ data.academicYear }} · {{ data.termName }}</template>
        </Column>
        <Column field="className" header="Kelas" />
        <Column field="gradeLevel" header="Tingkat" />
      </DataTable>
    </div>
  </Drawer>
</template>
