<script setup>
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SortableList from '@/shared/components/SortableList.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatDateTime } from '@/shared/utils/format'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { typeLabel } from '@/modules/questionbank'
import { listSubjectOptions } from '@/modules/subject'
import {
  archiveExam,
  deleteExam,
  duplicateExam,
  examStatusOf,
  getExam,
  publishExam,
  setExamQuestions,
  updateExam,
} from '../api/exam.api'
import ExamFormDialog from '../components/ExamFormDialog.vue'
import QuestionPickerDialog from '../components/QuestionPickerDialog.vue'
import {
  MAX_QUESTIONS,
  addQuestions,
  compositionKey,
  flattenGroups,
  groupBySection,
  totalPoints,
} from '../utils/composition'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const can = useCan('exams')
const canSchedule = useCan('exam_schedules')
const canQuestionBank = useCan('question_bank')
const notify = useNotify()
const { ask, confirmDelete } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })

const exam = ref(null)
const loadError = ref(null)
const subjects = ref([])
/** Susunan yang sedang diedit: [{ no, title, instruction, questions: [...] }] */
const groups = ref([])
const savedKey = ref('')
const rowErrors = ref({})
const saving = ref(false)

const isDraft = computed(() => exam.value?.status === 'draft')
const editable = computed(() => isDraft.value && exam.value?.canEdit && can.value.update)
const questions = computed(() => flattenGroups(groups.value))
const dirty = computed(
  () => Boolean(exam.value) && compositionKey(questions.value) !== savedKey.value,
)
const total = computed(() => totalPoints(questions.value))
const usedSections = computed(() => [...new Set(questions.value.map((q) => q.sectionNo))])

function applyExam(next) {
  exam.value = next
  groups.value = groupBySection(next.sections, next.questions ?? [])
  savedKey.value = compositionKey(flattenGroups(groups.value))
  rowErrors.value = {}
}

async function load() {
  loadError.value = null
  try {
    const [loaded, subjectList] = await Promise.all([
      getExam(route.params.id, scope()),
      listSubjectOptions(scope()).catch(() => []),
    ])
    subjects.value = subjectList
    applyExam(loaded)
  } catch (error) {
    loadError.value = error
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && load(),
  { immediate: true },
)

// ---- Susunan soal ----
const pickerVisible = ref(false)
const pickerSection = ref(1)

function openPicker(sectionNo = 1) {
  pickerSection.value = sectionNo
  pickerVisible.value = true
}

function onPick({ questions: picked, sectionNo }) {
  const next = addQuestions(questions.value, picked, sectionNo)
  groups.value = groupBySection(exam.value.sections, next)
}

function removeQuestion(group, index) {
  group.questions.splice(index, 1)
}

/** Nomor urut soal di seluruh paket (untuk tampilan). */
const numberOf = (group, index) => {
  let offset = 0
  for (const g of groups.value) {
    if (g === group) return offset + index + 1
    offset += g.questions.length
  }
  return index + 1
}

/** Error backend per baris: `items[3].points` → baris ke-4. */
function rowError(group, index) {
  const i = numberOf(group, index) - 1
  return Object.entries(rowErrors.value)
    .filter(([key]) => key.startsWith(`items[${i}]`))
    .map(([, message]) => message)
    .join('; ')
}

async function saveComposition() {
  saving.value = true
  rowErrors.value = {}
  try {
    applyExam(await setExamQuestions(exam.value.id, questions.value, scope()))
    notify.success('Susunan soal disimpan')
    return true
  } catch (error) {
    rowErrors.value = error.fieldErrors ?? {}
    notify.error(error.hasFieldErrors ? 'Periksa soal yang ditandai merah.' : error)
    return false
  } finally {
    saving.value = false
  }
}

function resetComposition() {
  applyExam(exam.value)
}

// ---- Info paket ----
const formVisible = ref(false)
async function saveInfo(values) {
  const updated = await updateExam(exam.value.id, values, scope())
  // Pertahankan susunan yang belum disimpan.
  const pending = questions.value
  exam.value = { ...updated, questions: exam.value.questions }
  savedKey.value = compositionKey(exam.value.questions ?? [])
  groups.value = groupBySection(updated.sections, pending)
  notify.success('Info paket disimpan')
}

// ---- Aksi status ----
async function publish() {
  if (dirty.value && !(await saveComposition())) return
  const ok = await ask({
    header: 'Publikasikan paket',
    message: `${questions.value.length} soal (${total.value} poin) akan dikunci. Setelah dipublikasikan, soal paket tidak bisa diubah — gunakan Duplikat untuk membuat versi baru. Lanjutkan?`,
    icon: 'pi pi-lock',
    acceptLabel: 'Publikasikan',
  })
  if (!ok) return
  try {
    applyExam(await publishExam(exam.value.id, scope()))
    notify.success('Paket dipublikasikan dan siap dijadwalkan')
  } catch (error) {
    notify.error(error)
  }
}

async function archive() {
  const ok = await ask({
    header: 'Arsipkan paket',
    message:
      'Paket tidak bisa dipilih lagi untuk jadwal baru. Jadwal yang sudah ada tidak terpengaruh.',
    acceptLabel: 'Arsipkan',
  })
  if (!ok) return
  try {
    applyExam({ ...(await archiveExam(exam.value.id, scope())), questions: exam.value.questions })
    notify.success('Paket diarsipkan')
  } catch (error) {
    notify.error(error)
  }
}

async function duplicate() {
  try {
    const copy = await duplicateExam(exam.value.id, scope())
    notify.success('Paket disalin sebagai draf dengan versi soal terbaru')
    router.push({ name: 'exam-detail', params: { id: copy.id }, query: route.query })
  } catch (error) {
    notify.error(error)
  }
}

async function remove() {
  if (!(await confirmDelete(`paket ${exam.value.title}`))) return
  try {
    await deleteExam(exam.value.id, scope())
    savedKey.value = compositionKey(questions.value)
    notify.success('Paket ujian dihapus')
    router.replace({ name: 'exams' })
  } catch (error) {
    notify.error(error)
  }
}

const canCreateHere = computed(() => !auth.isPlatformUser)

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return ask({
    header: 'Perubahan belum disimpan',
    message: 'Susunan soal belum disimpan. Tinggalkan halaman ini?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    danger: true,
  })
})
</script>

<template>
  <div class="page">
    <PageHeader :title="exam?.title ?? 'Paket ujian'" :description="exam?.subjectName ?? ''">
      <template #actions>
        <Button
          label="Paket ujian"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'exams', query: route.query })"
        />
        <template v-if="exam">
          <Button
            v-if="can.create && canCreateHere"
            label="Duplikat"
            icon="pi pi-copy"
            severity="secondary"
            outlined
            @click="duplicate"
          />
          <Button
            v-if="isDraft && exam.canEdit && can.delete"
            label="Hapus"
            icon="pi pi-trash"
            severity="danger"
            text
            @click="remove"
          />
          <Button
            v-if="exam.status === 'published' && exam.canEdit && can.update"
            label="Arsipkan"
            icon="pi pi-inbox"
            severity="secondary"
            outlined
            @click="archive"
          />
          <Button
            v-if="exam.status === 'published' && canSchedule.create && canCreateHere"
            label="Buat jadwal"
            icon="pi pi-calendar-plus"
            @click="router.push({ name: 'schedule-new', query: { exam: exam.id } })"
          />
          <Button
            v-if="editable"
            label="Publikasikan"
            icon="pi pi-send"
            :disabled="!questions.length || saving"
            @click="publish"
          />
        </template>
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Paket tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!exam && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <div v-else-if="exam" class="question-form">
      <Card class="question-form__main">
        <template #title>
          <div class="toolbar">
            <span>Susunan soal</span>
            <span class="text-muted exam-total"
              >{{ questions.length }} soal · {{ total }} poin</span
            >
            <template v-if="editable">
              <Button
                label="Tambah soal"
                icon="pi pi-plus"
                size="small"
                outlined
                :disabled="questions.length >= MAX_QUESTIONS"
                @click="openPicker(groups[groups.length - 1]?.no ?? 1)"
              />
              <Button
                v-if="dirty"
                label="Batalkan"
                size="small"
                severity="secondary"
                text
                :disabled="saving"
                @click="resetComposition"
              />
              <Button
                label="Simpan susunan"
                icon="pi pi-check"
                size="small"
                :disabled="!dirty"
                :loading="saving"
                @click="saveComposition"
              />
            </template>
          </div>
        </template>
        <template #content>
          <Message v-if="!isDraft" severity="secondary" :closable="false" icon="pi pi-lock">
            Paket sudah {{ examStatusOf(exam.status).label.toLowerCase() }}: versi soal terkunci dan
            susunan tidak bisa diubah. Gunakan <strong>Duplikat</strong> untuk membuat draf baru.
          </Message>
          <Message v-else-if="dirty" severity="warn" :closable="false">
            Ada perubahan susunan yang belum disimpan.
          </Message>

          <section v-for="group in groups" :key="group.no" class="exam-group">
            <header class="exam-group__header">
              <div>
                <h3 class="form-section-title">
                  {{ group.title || `Bagian ${group.no}` }}
                  <span class="text-muted">· {{ group.questions.length }} soal</span>
                </h3>
                <p v-if="group.instruction" class="text-muted">{{ group.instruction }}</p>
              </div>
              <Button
                v-if="editable && groups.length > 1"
                label="Tambah ke bagian ini"
                icon="pi pi-plus"
                size="small"
                text
                @click="openPicker(group.no)"
              />
            </header>

            <SortableList
              v-model="group.questions"
              :item-key="(q) => q.questionId"
              handle=".drag-handle"
              group="exam-questions"
              :disabled="!editable"
              class="exam-question-list"
            >
              <template #item="{ item, index }">
                <div
                  class="exam-question"
                  :class="{ 'exam-question--error': rowError(group, index) }"
                >
                  <i v-if="editable" class="pi pi-bars drag-handle" aria-hidden="true" />
                  <span class="exam-question__no">{{ numberOf(group, index) }}</span>
                  <div class="exam-question__body">
                    <div class="exam-question__meta">
                      <Tag :value="typeLabel(item.typeCode)" severity="secondary" />
                      <span v-if="item.versionNo" class="text-muted">v{{ item.versionNo }}</span>
                      <RouterLink
                        v-if="canQuestionBank.view"
                        :to="{ name: 'question-detail', params: { id: item.questionId } }"
                        class="text-muted"
                        target="_blank"
                        >lihat soal <i class="pi pi-external-link" aria-hidden="true"
                      /></RouterLink>
                    </div>
                    <p class="exam-question__text">{{ item.preview || '(tanpa teks)' }}</p>
                    <small v-if="rowError(group, index)" class="form-field__error" role="alert">{{
                      rowError(group, index)
                    }}</small>
                  </div>
                  <div class="exam-question__points">
                    <InputNumber
                      v-if="editable"
                      v-model="item.points"
                      :min="0"
                      :max="9999"
                      :max-fraction-digits="2"
                      :use-grouping="false"
                      :input-props="{ 'aria-label': `Bobot soal ${numberOf(group, index)}` }"
                      suffix=" poin"
                      size="small"
                    />
                    <span v-else>{{ item.points }} poin</span>
                  </div>
                  <Button
                    v-if="editable"
                    icon="pi pi-times"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    :aria-label="`Keluarkan soal ${numberOf(group, index)}`"
                    @click="removeQuestion(group, index)"
                  />
                </div>
              </template>
            </SortableList>
            <p v-if="!group.questions.length" class="text-muted exam-group__empty">
              Belum ada soal di bagian ini.
              <template v-if="editable && groups.length > 1"
                >Seret soal ke sini atau tambahkan dari bank soal.</template
              >
            </p>
          </section>

          <EmptyState
            v-if="!questions.length && editable"
            icon="pi pi-database"
            title="Paket belum berisi soal"
            description="Pilih soal aktif dari bank soal. Bobot awal mengikuti bobot bawaan soal."
          >
            <Button label="Tambah soal" icon="pi pi-plus" @click="openPicker(1)" />
          </EmptyState>
        </template>
      </Card>

      <Card class="question-form__side">
        <template #title>
          <div class="toolbar">
            <span>Informasi</span>
            <Button
              v-if="editable"
              label="Ubah"
              icon="pi pi-pencil"
              size="small"
              text
              @click="formVisible = true"
            />
          </div>
        </template>
        <template #content>
          <dl class="detail-list">
            <dt>Status</dt>
            <dd>
              <Tag
                :value="examStatusOf(exam.status).label"
                :severity="examStatusOf(exam.status).severity"
              />
            </dd>
            <dt>Mata pelajaran</dt>
            <dd>{{ exam.subjectName ?? '-' }}</dd>
            <dt>Tingkat</dt>
            <dd>{{ exam.gradeLevel ?? '-' }}</dd>
            <dt>Bagian</dt>
            <dd>{{ groups.length }}</dd>
            <dt>Pembuat</dt>
            <dd>{{ exam.creatorName ?? '-' }}</dd>
            <dt>Dipublikasikan</dt>
            <dd>{{ exam.publishedAt ? formatDateTime(exam.publishedAt) : '-' }}</dd>
          </dl>
          <p v-if="exam.description" class="exam-description">{{ exam.description }}</p>
        </template>
      </Card>
    </div>

    <ExamFormDialog
      v-model:visible="formVisible"
      :exam="exam"
      :subjects="subjects"
      :used-sections="usedSections"
      :submit="saveInfo"
    />
    <QuestionPickerDialog
      v-if="exam"
      v-model:visible="pickerVisible"
      :school-id="school.scopeId.value"
      :subject-id="exam.subjectId"
      :subjects="subjects"
      :used-ids="questions.map((q) => q.questionId)"
      :sections="groups"
      :default-section="pickerSection"
      :remaining="MAX_QUESTIONS - questions.length"
      @pick="onPick"
    />
  </div>
</template>
