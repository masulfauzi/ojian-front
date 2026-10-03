<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatZoned, formatZonedRange } from '@/shared/utils/zonedTime'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { RemedialDialog, ScheduleStateTags, getSchedule, publishResults } from '@/modules/schedule'
import { getResults } from '../api/grading.api'
import AnalysisTab from '../components/AnalysisTab.vue'
import GradingTab from '../components/GradingTab.vue'
import ResultSummaryTab from '../components/ResultSummaryTab.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const can = useCan('exam_results')
const canSchedules = useCan('exam_schedules')
const canExams = useCan('exams')
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({
  school_id: { type: 'string' },
  tab: { type: 'string', options: ['recap', 'grading', 'analysis'] },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const linkQuery = computed(() => (school.scopeId.value ? { school_id: school.scopeId.value } : {}))
const tab = computed({
  get: () => query.value.tab || 'recap',
  set: (value) => update({ tab: value === 'recap' ? '' : value }),
})

const schedule = ref(null)
const results = ref(null)
const loadError = ref(null)

const pending = computed(() => results.value?.summary.pendingGrading ?? 0)
// Hasil manual: siswa melihat nilai setelah guru mempublikasikan.
const canPublish = computed(
  () =>
    can.value.update &&
    schedule.value &&
    (schedule.value.resultVisibility === 'manual' || schedule.value.reviewVisibility === 'manual'),
)

async function loadResults() {
  results.value = await getResults(route.params.id, scope())
}

async function load() {
  loadError.value = null
  try {
    schedule.value = await getSchedule(route.params.id, scope())
    await loadResults()
  } catch (error) {
    loadError.value = error
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && load(),
  { immediate: true },
)

const refresh = () => loadResults().catch((error) => notify.error(error))

async function publish() {
  const again = Boolean(schedule.value.resultsPublishedAt)
  const ok = await ask({
    header: 'Publikasikan hasil',
    message: pending.value
      ? `${pending.value} pengerjaan masih menunggu penilaian; siswa tersebut melihat "menunggu penilaian". Tetap publikasikan?`
      : 'Siswa dapat melihat nilai (dan pembahasan bila diatur "saat guru mempublikasikan"). Lanjutkan?',
    icon: 'pi pi-send',
    acceptLabel: again ? 'Publikasikan ulang' : 'Publikasikan',
  })
  if (!ok) return
  try {
    schedule.value = await publishResults(schedule.value.id, scope())
    notify.success('Hasil ujian dipublikasikan')
    await refresh()
  } catch (error) {
    notify.error(error)
  }
}

const remedialVisible = ref(false)
const onRemedialCreated = (created) =>
  router.push({ name: 'schedule-detail', params: { id: created.id }, query: linkQuery.value })
</script>

<template>
  <div class="page">
    <PageHeader
      :title="schedule?.title ?? 'Hasil ujian'"
      :description="
        schedule
          ? `${schedule.examTitle} · ${formatZonedRange(schedule.startsAt, schedule.endsAt, schedule.timezone)}`
          : ''
      "
    >
      <template #actions>
        <Button
          label="Daftar jadwal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'results', query: linkQuery })"
        />
        <template v-if="schedule">
          <Button
            v-if="canSchedules.create && !auth.isPlatformUser"
            label="Remedial"
            icon="pi pi-replay"
            severity="secondary"
            outlined
            @click="remedialVisible = true"
          />
          <Button
            v-if="canPublish"
            :label="schedule.resultsPublishedAt ? 'Publikasikan ulang' : 'Publikasikan hasil'"
            icon="pi pi-send"
            @click="publish"
          />
        </template>
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Hasil tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!results && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <template v-else-if="results">
      <Card>
        <template #content>
          <div class="result-meta">
            <ScheduleStateTags :schedule="schedule" />
            <span class="text-muted">
              KKM {{ results.passingScore ?? '-' }} ·
              {{
                {
                  best: 'nilai terbaik',
                  latest: 'pengerjaan terakhir',
                  first: 'pengerjaan pertama',
                }[results.scorePolicy]
              }}
            </span>
            <span v-if="schedule.resultsPublishedAt" class="text-muted">
              · hasil dipublikasikan
              {{ formatZoned(schedule.resultsPublishedAt, schedule.timezone) }}
            </span>
          </div>
          <Message
            v-if="schedule.resultVisibility === 'manual' && !schedule.resultsPublishedAt"
            severity="info"
            :closable="false"
          >
            Nilai belum terlihat siswa sampai Anda menekan <strong>Publikasikan hasil</strong>.
          </Message>
        </template>
      </Card>

      <Tabs v-model:value="tab">
        <TabList>
          <Tab value="recap"><i class="pi pi-table" aria-hidden="true" /> Rekap nilai</Tab>
          <Tab value="grading">
            <i class="pi pi-pencil" aria-hidden="true" /> Penilaian
            <Badge v-if="pending" :value="pending" severity="warn" />
          </Tab>
          <Tab v-if="canExams.view" value="analysis">
            <i class="pi pi-chart-bar" aria-hidden="true" /> Analisis butir
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="recap">
            <ResultSummaryTab :schedule="schedule" :results="results" />
          </TabPanel>
          <TabPanel value="grading">
            <GradingTab
              :schedule-id="schedule.id"
              :school-id="school.scopeId.value"
              :can-grade="can.update"
              @graded="refresh"
            />
          </TabPanel>
          <TabPanel v-if="canExams.view" value="analysis">
            <AnalysisTab
              :exam-id="schedule.examId"
              :school-id="school.scopeId.value"
              :can-regrade="can.update"
              @regraded="refresh"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <RemedialDialog
      v-if="schedule"
      v-model:visible="remedialVisible"
      :schedule="schedule"
      :school-id="school.scopeId.value"
      @created="onRemedialCreated"
    />
  </div>
</template>
