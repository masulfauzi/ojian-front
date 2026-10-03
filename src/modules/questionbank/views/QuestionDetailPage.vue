<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatDateTime } from '@/shared/utils/format'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { listSubjectOptions } from '@/modules/subject'
import {
  QUESTION_STATUSES,
  copyQuestion,
  deleteQuestion,
  getQuestion,
  getVersion,
  listVersions,
  previewQuestion,
  setQuestionStatus,
  statusOf,
} from '../api/question.api'
import AnswerKeySummary from '../components/AnswerKeySummary.vue'
import QuestionHtml from '../components/QuestionHtml.vue'
import QuestionPreview from '../components/preview/QuestionPreview.vue'
import { difficultyOf, visibilityOf } from '../constants'
import { typeOf } from '../types/definitions'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const can = useCan('question_bank')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })

const question = ref(null)
const loadError = ref(null)
const subjects = ref([])
const preview = ref(null)
const previewAnswer = ref(null)
const seed = ref(1)
const versions = ref([])

const version = computed(() => question.value?.currentVersion)
const type = computed(() => typeOf(question.value?.typeCode))
const subjectName = computed(
  () => subjects.value.find((s) => s.id === question.value?.subjectId)?.name ?? '-',
)
const canEdit = computed(() => question.value?.canEdit && can.value.update)

async function loadPreview(nextSeed = seed.value) {
  seed.value = nextSeed
  try {
    preview.value = await previewQuestion(route.params.id, { seed: nextSeed, ...scope() })
    previewAnswer.value = null
  } catch (error) {
    notify.error(error)
  }
}

async function load() {
  loadError.value = null
  try {
    const [q, list, subjectList] = await Promise.all([
      getQuestion(route.params.id, scope()),
      listVersions(route.params.id, scope()),
      listSubjectOptions(scope()).catch(() => []),
    ])
    question.value = q
    versions.value = list
    subjects.value = subjectList
    await loadPreview(1)
  } catch (error) {
    loadError.value = error
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && load(),
  { immediate: true },
)

// ---- Aksi ----
const changingStatus = ref(false)
async function changeStatus(status) {
  if (!status || status === question.value.status) return
  changingStatus.value = true
  try {
    question.value = await setQuestionStatus(question.value.id, status, scope())
    notify.success(`Status soal: ${statusOf(status).label}`)
  } catch (error) {
    notify.error(error)
  } finally {
    changingStatus.value = false
  }
}

async function copy() {
  try {
    const copied = await copyQuestion(question.value.id, scope())
    notify.success('Soal disalin ke bank soal Anda sebagai draf pribadi')
    router.push({ name: 'question-detail', params: { id: copied.id } })
  } catch (error) {
    notify.error(error)
  }
}

async function remove() {
  if (!(await confirmDelete('soal ini'))) return
  try {
    await deleteQuestion(question.value.id, scope())
    notify.success('Soal berhasil dihapus')
    router.replace({ name: 'question-bank' })
  } catch (error) {
    notify.error(error)
  }
}

// ---- Riwayat versi ----
const versionDialog = ref(false)
const viewedVersion = ref(null)
async function openVersion(summary) {
  try {
    viewedVersion.value = await getVersion(question.value.id, summary.versionNo, scope())
    versionDialog.value = true
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader :title="type ? type.label : 'Soal'" :description="question?.topic || ''">
      <template #actions>
        <Button
          label="Bank soal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'question-bank' })"
        />
        <template v-if="question">
          <Button
            v-if="can.create && !auth.isPlatformUser"
            label="Salin"
            icon="pi pi-copy"
            severity="secondary"
            outlined
            @click="copy"
          />
          <Button
            v-if="question.canEdit && can.delete"
            label="Hapus"
            icon="pi pi-trash"
            severity="danger"
            text
            @click="remove"
          />
          <Button
            v-if="canEdit"
            label="Ubah"
            icon="pi pi-pencil"
            @click="router.push({ name: 'question-edit', params: { id: question.id } })"
          />
        </template>
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Soal tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!question && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <div v-else-if="question" class="question-form">
      <Card class="question-form__main">
        <template #title>
          <div class="toolbar">
            <span>Pratinjau siswa</span>
            <span class="text-muted preview-seed">acak #{{ seed }}</span>
            <Button
              label="Acak ulang"
              icon="pi pi-refresh"
              size="small"
              text
              @click="loadPreview(seed + 1)"
            />
          </div>
        </template>
        <template #content>
          <QuestionPreview
            v-if="preview"
            v-model:answer="previewAnswer"
            :question="preview"
            :school-id="school.scopeId.value"
          />
          <Message severity="secondary" :closable="false" class="preview-note">
            Coba jawab untuk melihat pengalaman siswa. Jawaban tidak disimpan.
          </Message>
        </template>
      </Card>

      <Card class="question-form__side">
        <template #title>Informasi</template>
        <template #content>
          <div class="form-stack">
            <div class="form-field">
              <span class="form-field__label">Status</span>
              <SelectButton
                v-if="canEdit"
                :model-value="question.status"
                :options="QUESTION_STATUSES"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                :disabled="changingStatus"
                aria-label="Status soal"
                @update:model-value="changeStatus"
              />
              <Tag
                v-else
                :value="statusOf(question.status).label"
                :severity="statusOf(question.status).severity"
              />
              <small class="form-field__hint"
                >Hanya soal Aktif yang bisa dimasukkan ke paket ujian.</small
              >
            </div>
            <dl class="detail-list">
              <dt>Mata pelajaran</dt>
              <dd>{{ subjectName }}</dd>
              <dt>Tingkat</dt>
              <dd>{{ question.gradeLevel ?? '-' }}</dd>
              <dt>Kesulitan</dt>
              <dd>{{ difficultyOf(question.difficulty)?.label ?? '-' }}</dd>
              <dt>Level kognitif</dt>
              <dd>{{ question.cognitiveLevel ?? '-' }}</dd>
              <dt>Bobot</dt>
              <dd>{{ version.defaultPoints }}</dd>
              <dt>Penilaian</dt>
              <dd>
                {{ version.scoring?.mode === 'partial' ? 'Parsial' : 'Semua atau tidak' }}
                <template v-if="version.scoring?.wrong_penalty">
                  · penalti {{ version.scoring.wrong_penalty }}</template
                >
              </dd>
              <dt>Visibilitas</dt>
              <dd>{{ visibilityOf(question.visibility)?.label }}</dd>
              <dt>Versi</dt>
              <dd>
                {{ version.versionNo }}
                <Tag v-if="version.isLocked" value="Terkunci" severity="warn" icon="pi pi-lock" />
              </dd>
            </dl>
            <div v-if="question.tags.length" class="tag-list">
              <Tag
                v-for="tag in question.tags"
                :key="tag"
                :value="`#${tag}`"
                severity="secondary"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="question-form__main">
        <template #title>Kunci jawaban</template>
        <template #content>
          <AnswerKeySummary
            :type-code="question.typeCode"
            :content="version.content"
            :answer-key="version.answerKey"
            :school-id="school.scopeId.value"
          />
          <template v-if="version.explanation">
            <h3 class="form-section-title">Pembahasan</h3>
            <QuestionHtml :html="version.explanation" :school-id="school.scopeId.value" />
          </template>
        </template>
      </Card>

      <Card class="question-form__side">
        <template #title>Riwayat versi</template>
        <template #content>
          <DataTable :value="versions" size="small" data-key="id">
            <Column header="Versi">
              <template #body="{ data }">
                v{{ data.versionNo }}
                <Tag v-if="data.isCurrent" value="Aktif" severity="success" />
                <i
                  v-if="data.isLocked"
                  v-tooltip.top="'Terkunci (dipakai ujian)'"
                  class="pi pi-lock text-muted"
                />
              </template>
            </Column>
            <Column header="Dibuat">
              <template #body="{ data }"
                ><span class="text-muted">{{ formatDateTime(data.createdAt) }}</span></template
              >
            </Column>
            <Column>
              <template #body="{ data }">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  size="small"
                  :aria-label="`Lihat versi ${data.versionNo}`"
                  @click="openVersion(data)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="versionDialog"
      :header="`Versi ${viewedVersion?.versionNo ?? ''}`"
      :style="{ width: 'min(44rem, calc(100vw - 2rem))' }"
      modal
    >
      <div v-if="viewedVersion && question" class="form-stack">
        <QuestionPreview
          :question="{ type: question.typeCode, content: viewedVersion.content }"
          :school-id="school.scopeId.value"
          disabled
        />
        <h3 class="form-section-title">Kunci jawaban</h3>
        <AnswerKeySummary
          :type-code="question.typeCode"
          :content="viewedVersion.content"
          :answer-key="viewedVersion.answerKey"
          :school-id="school.scopeId.value"
        />
      </div>
    </Dialog>
  </div>
</template>
