<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import BaseChart from '@/shared/components/BaseChart.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { formatNumber } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import { getExam } from '@/modules/exam'
import { listVersions, typeLabel } from '@/modules/questionbank'
import { getAnalysis, regradeQuestion } from '../api/grading.api'
import { difficultyLabel } from '../utils/rubric'

// Analisis butir soal paket (dari pengerjaan yang sudah dikumpulkan di semua jadwal paket)
// dan koreksi kunci / nilai ulang.
const props = defineProps({
  examId: { type: String, required: true },
  schoolId: { type: String, default: null },
  canRegrade: { type: Boolean, default: false },
})
const emit = defineEmits(['regraded'])
const notify = useNotify()
const { ask } = useConfirm()
const canQuestionBank = useCan('question_bank')

const questions = ref([])
const loading = ref(false)
const loadError = ref(null)
const analyses = ref({})
const expanded = ref({})

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const exam = await getExam(props.examId, { schoolId: props.schoolId })
    questions.value = (exam.questions ?? []).map((q, i) => ({ ...q, number: i + 1 }))
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}
watch(() => props.examId, load, { immediate: true })

async function loadAnalysis(row) {
  analyses.value = { ...analyses.value, [row.id]: { loading: true } }
  try {
    analyses.value = {
      ...analyses.value,
      [row.id]: await getAnalysis(row.id, { schoolId: props.schoolId }),
    }
  } catch (error) {
    analyses.value = { ...analyses.value, [row.id]: { error } }
  }
}

const onExpand = ({ data }) =>
  (!analyses.value[data.id] || analyses.value[data.id].error) && loadAnalysis(data)

function chartData(analysis) {
  const labels = analysis.distribution.map((d) => d.optionId.toUpperCase())
  return {
    labels,
    datasets: [
      {
        label: 'Jumlah siswa',
        data: analysis.distribution.map((d) => d.total),
        backgroundColor: '#10b981',
      },
    ],
  }
}
const chartOptions = {
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

// ---- Koreksi kunci / nilai ulang ----
const regrade = ref({ visible: false, row: null, versions: [], versionId: null, saving: false })
const versionOptions = computed(() => [
  { value: null, label: 'Versi saat ini (nilai ulang saja)' },
  ...regrade.value.versions
    .filter((v) => v.id !== regrade.value.row?.questionVersionId)
    .map((v) => ({ value: v.id, label: `Versi ${v.versionNo}${v.isCurrent ? ' (terbaru)' : ''}` })),
])

async function openRegrade(row) {
  regrade.value = { visible: true, row, versions: [], versionId: null, saving: false }
  if (!canQuestionBank.value.view) return
  try {
    regrade.value.versions = await listVersions(row.questionId, { schoolId: props.schoolId })
  } catch {
    regrade.value.versions = []
  }
}

async function runRegrade() {
  const state = regrade.value
  if (state.versionId) {
    const ok = await ask({
      header: 'Koreksi kunci',
      message:
        'Soal ini akan memakai versi pengganti di SEMUA jadwal paket ini, lalu semua jawabannya dinilai ulang. Versi pengganti harus berisi konten identik (hanya kunci/penilaian berbeda). Lanjutkan?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Koreksi & nilai ulang',
      danger: true,
    })
    if (!ok) return
  }
  state.saving = true
  try {
    const result = await regradeQuestion(
      state.row.id,
      { questionVersionId: state.versionId },
      { schoolId: props.schoolId },
    )
    notify.success(`${result.regraded} jawaban dinilai ulang pada ${result.attempts} pengerjaan`)
    state.visible = false
    if (state.versionId) await load()
    await loadAnalysis(state.row)
    emit('regraded')
  } catch (error) {
    notify.error(error)
  } finally {
    state.saving = false
  }
}
</script>

<template>
  <div class="form-stack">
    <p class="text-muted">
      Dihitung dari pengerjaan yang sudah dikumpulkan di semua jadwal yang memakai paket ini. Buka
      baris untuk melihat analisis soal.
    </p>
    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 2.5rem" /></div>
    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Soal paket tidak dapat dimuat"
      :description="loadError.message"
    />
    <DataTable
      v-else
      v-model:expanded-rows="expanded"
      :value="questions"
      data-key="id"
      size="small"
      @row-expand="onExpand"
    >
      <Column expander header-style="width: 3rem" />
      <Column field="number" header="No" />
      <Column header="Soal">
        <template #body="{ data }">
          <span class="question-cell__text">{{ data.preview || '(tanpa teks)' }}</span>
        </template>
      </Column>
      <Column header="Jenis">
        <template #body="{ data }">
          {{ typeLabel(data.typeCode) }}
          <span class="text-muted">· v{{ data.versionNo }}</span>
        </template>
      </Column>
      <Column header="Bobot">
        <template #body="{ data }">{{ data.points }}</template>
      </Column>
      <Column v-if="canRegrade">
        <template #body="{ data }">
          <Button
            v-tooltip.top="'Nilai ulang / koreksi kunci'"
            icon="pi pi-sync"
            severity="secondary"
            text
            rounded
            size="small"
            :aria-label="`Nilai ulang soal ${data.number}`"
            @click="openRegrade(data)"
          />
        </template>
      </Column>
      <template #expansion="{ data }">
        <div class="analysis-panel">
          <ProgressSpinner v-if="analyses[data.id]?.loading" style="width: 2rem" />
          <p v-else-if="analyses[data.id]?.error" class="text-muted">
            {{ analyses[data.id].error.message }}
          </p>
          <template v-else-if="analyses[data.id]">
            <dl class="detail-list">
              <dt>Menjawab</dt>
              <dd>
                {{ analyses[data.id].total - analyses[data.id].unanswered }} dari
                {{ analyses[data.id].total }}
              </dd>
              <dt>Tidak menjawab</dt>
              <dd>{{ analyses[data.id].unanswered }}</dd>
              <dt>Indeks kesukaran</dt>
              <dd>
                <template v-if="analyses[data.id].difficultyIndex !== null">
                  {{
                    formatNumber(analyses[data.id].difficultyIndex, { maximumFractionDigits: 2 })
                  }}
                  <Tag
                    :value="difficultyLabel(analyses[data.id].difficultyIndex).label"
                    :severity="difficultyLabel(analyses[data.id].difficultyIndex).severity"
                  />
                </template>
                <span v-else class="text-muted">belum ada data</span>
              </dd>
            </dl>
            <div v-if="analyses[data.id].distribution.length" class="analysis-chart">
              <h4 class="form-section-title">Sebaran pilihan</h4>
              <BaseChart
                type="bar"
                :data="chartData(analyses[data.id])"
                :options="chartOptions"
                height="12rem"
              />
            </div>
          </template>
        </div>
      </template>
    </DataTable>

    <Dialog
      v-model:visible="regrade.visible"
      :header="`Nilai ulang soal ${regrade.row?.number ?? ''}`"
      :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
      modal
    >
      <div class="form-stack">
        <p class="text-muted">
          Untuk memperbaiki kunci yang salah: ubah soal di Bank Soal (membuat versi baru karena
          versi ujian terkunci), lalu pilih versi itu di sini.
        </p>
        <div class="form-field">
          <label class="form-field__label" for="regrade-version">Versi soal</label>
          <Select
            v-model="regrade.versionId"
            input-id="regrade-version"
            :options="versionOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
        <Message v-if="regrade.versionId" severity="warn" :closable="false">
          Berlaku untuk semua jadwal yang memakai paket ini.
        </Message>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <Button label="Batal" severity="secondary" outlined @click="regrade.visible = false" />
          <Button
            :label="regrade.versionId ? 'Koreksi & nilai ulang' : 'Nilai ulang'"
            icon="pi pi-sync"
            :loading="regrade.saving"
            @click="runRegrade"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
