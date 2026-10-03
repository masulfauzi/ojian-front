<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { formatZonedRange } from '@/shared/utils/zonedTime'
import { listMyExams, startExam } from '../api/myexam.api'
import StartExamDialog from '../components/StartExamDialog.vue'

const router = useRouter()
const notify = useNotify()

const exams = ref([])
const loading = ref(true)

const STATE = {
  open: { label: 'Berlangsung', severity: 'success' },
  upcoming: { label: 'Akan datang', severity: 'info' },
  finished: { label: 'Selesai', severity: 'secondary' },
}
const ORDER = { open: 0, upcoming: 1, finished: 2 }
const sorted = computed(() =>
  [...exams.value].sort(
    (a, b) =>
      ORDER[a.timeState] - ORDER[b.timeState] || Date.parse(a.startsAt) - Date.parse(b.startsAt),
  ),
)

async function load() {
  loading.value = true
  try {
    exams.value = await listMyExams()
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}
onMounted(load)

const inProgress = (exam) => exam.attemptStatus === 'in_progress'
const canStart = (exam) => exam.timeState === 'open' && exam.attemptsLeft > 0 && !inProgress(exam)
const hasResult = (exam) => exam.attemptId && exam.attemptStatus === 'submitted'

const goAttempt = (attemptId) => router.push({ name: 'attempt', params: { id: attemptId } })

const starting = ref(null)
const dialogVisible = ref(false)
function openStart(exam) {
  starting.value = exam
  dialogVisible.value = true
}
async function start(token) {
  const attempt = await startExam(starting.value.scheduleId, token)
  dialogVisible.value = false
  goAttempt(attempt.id)
}

// Melanjutkan pengerjaan berjalan tidak butuh token (server mengembalikan pengerjaan itu).
async function resume(exam) {
  try {
    const attempt = await startExam(exam.scheduleId)
    goAttempt(attempt.id)
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader title="Ujian Saya" description="Ujian yang dijadwalkan untuk Anda">
      <template #actions>
        <Button
          label="Muat ulang"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="load"
        />
      </template>
    </PageHeader>

    <div v-if="loading && !exams.length" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>
    <EmptyState
      v-else-if="!exams.length"
      icon="pi pi-calendar"
      title="Belum ada ujian"
      description="Ujian dari 7 hari terakhir dan yang akan datang muncul di sini."
    />
    <div v-else class="my-exam-grid">
      <Card v-for="exam in sorted" :key="exam.scheduleId" class="my-exam-card">
        <template #title>
          <div class="my-exam-card__head">
            <span>{{ exam.title }}</span>
            <Tag
              :value="STATE[exam.timeState]?.label ?? exam.timeState"
              :severity="STATE[exam.timeState]?.severity"
            />
          </div>
        </template>
        <template #subtitle>{{ exam.subjectName }} · {{ exam.examTitle }}</template>
        <template #content>
          <ul class="plain-list my-exam-card__meta">
            <li>
              <i class="pi pi-calendar" aria-hidden="true" />
              {{ formatZonedRange(exam.startsAt, exam.endsAt, exam.timezone) }}
            </li>
            <li><i class="pi pi-clock" aria-hidden="true" /> {{ exam.durationMinutes }} menit</li>
            <li v-if="exam.tokenEnabled">
              <i class="pi pi-key" aria-hidden="true" /> Memakai token dari pengawas
            </li>
            <li v-if="exam.timeState !== 'finished'">
              <i class="pi pi-replay" aria-hidden="true" /> Sisa kesempatan: {{ exam.attemptsLeft }}
            </li>
          </ul>
        </template>
        <template #footer>
          <div class="my-exam-card__actions">
            <Button
              v-if="inProgress(exam) && exam.timeState === 'open'"
              label="Lanjutkan"
              icon="pi pi-arrow-right"
              @click="resume(exam)"
            />
            <Button
              v-else-if="canStart(exam)"
              :label="exam.attemptId ? 'Kerjakan lagi' : 'Mulai'"
              icon="pi pi-play"
              @click="openStart(exam)"
            />
            <Button
              v-if="hasResult(exam)"
              label="Lihat hasil"
              icon="pi pi-chart-bar"
              severity="secondary"
              outlined
              @click="router.push({ name: 'attempt-result', params: { id: exam.attemptId } })"
            />
            <span v-if="exam.timeState === 'upcoming'" class="text-muted">Belum dibuka</span>
            <span v-else-if="exam.timeState === 'finished' && !exam.attemptId" class="text-muted"
              >Tidak dikerjakan</span
            >
          </div>
        </template>
      </Card>
    </div>

    <StartExamDialog v-model:visible="dialogVisible" :exam="starting" :submit="start" />
  </div>
</template>
