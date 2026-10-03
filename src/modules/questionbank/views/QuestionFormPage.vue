<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Drawer from 'primevue/drawer'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SelectButton from 'primevue/selectbutton'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import TagInput from '@/shared/components/TagInput.vue'
import FormField from '@/shared/components/form/FormField.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { useAuthStore } from '@/modules/auth'
import { listSubjectOptions } from '@/modules/subject'
import {
  createQuestion,
  getQuestion,
  listQuestionTypes,
  updateQuestion,
  validateQuestion,
} from '../api/question.api'
import { listStimuli } from '../api/stimulus.api'
import QuestionPreview from '../components/preview/QuestionPreview.vue'
import { uploadQuestionImage } from '../composables/useImageUpload'
import { resolveMediaHtml, resolveMediaJson } from '../composables/useMediaResolver'
import { COGNITIVE_LEVELS, DIFFICULTY_OPTIONS, VISIBILITY_OPTIONS } from '../constants'
import { questionMetaSchema } from '../schemas/question.schema'
import { buildScoring, scoringOptions, typeOf } from '../types/definitions'
import { EDITORS } from '../types/editors'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirm()

const questionId = computed(() => route.params.id ?? null)
const isEdit = computed(() => Boolean(questionId.value))

const loading = ref(true)
const loadError = ref(null)
const types = ref([])
const subjects = ref([])
const stimuli = ref([])
const question = ref(null)

// ---- Metadata (vee-validate) ----
const form = useForm({ validationSchema: toTypedSchema(questionMetaSchema) })
const applyServerErrors = useServerErrors(form)
const tagsField = useField('tags')
const scoringMode = useField('scoringMode')
const wrongPenalty = useField('wrongPenalty')
const defaultPoints = computed(() => Number(form.values.defaultPoints) || 0)

// ---- Isi soal per jenis ----
const typeCode = ref(null)
const model = ref(null) // { content, answerKey }
const explanation = ref('')
const serverErrors = ref({})
const formError = ref('')
const dirty = ref(false)

const type = computed(() => typeOf(typeCode.value))
const editor = computed(() => EDITORS[typeCode.value] ?? null)
const typeOptions = computed(() =>
  types.value.filter((t) => typeOf(t.code)).map((t) => ({ ...t, icon: typeOf(t.code).icon })),
)
const scoringChoices = computed(() => scoringOptions(typeCode.value))
const subjectOptions = computed(() =>
  subjects.value
    .filter((s) => s.isActive || s.id === question.value?.subjectId)
    .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
)
const stimulusOptions = computed(() => stimuli.value.map((s) => ({ value: s.id, label: s.title })))
const locked = computed(() => Boolean(question.value?.currentVersion?.isLocked))

function chooseType(code) {
  typeCode.value = code
  model.value = typeOf(code).empty()
  serverErrors.value = {}
  if (!typeOf(code).partial && scoringMode.value.value === 'partial')
    scoringMode.value.value = 'all_or_nothing'
  if (!typeOf(code).penalty) wrongPenalty.value.value = 0
}

async function changeType(code) {
  if (code === typeCode.value) return
  if (typeCode.value && dirty.value) {
    const ok = await ask({
      header: 'Ganti jenis soal',
      message: 'Isi soal yang sudah ditulis akan dikosongkan. Lanjutkan?',
      acceptLabel: 'Ganti',
      danger: true,
    })
    if (!ok) return
  }
  chooseType(code)
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [typeList, subjectList, stimulusList] = await Promise.all([
      listQuestionTypes(),
      listSubjectOptions(),
      listStimuli({ limit: 100 }),
    ])
    types.value = typeList
    subjects.value = subjectList
    stimuli.value = stimulusList.items

    if (isEdit.value) {
      const q = await getQuestion(questionId.value)
      const version = q.currentVersion
      question.value = q
      typeCode.value = q.typeCode
      model.value = {
        content: await resolveMediaJson(version.content),
        answerKey: await resolveMediaJson(version.answerKey),
      }
      explanation.value = await resolveMediaHtml(version.explanation)
      form.resetForm({
        values: {
          subjectId: q.subjectId,
          gradeLevel: q.gradeLevel,
          topic: q.topic ?? '',
          tags: q.tags,
          difficulty: q.difficulty,
          cognitiveLevel: q.cognitiveLevel,
          visibility: q.visibility,
          defaultPoints: version.defaultPoints,
          stimulusId: version.stimulusId,
          scoringMode: version.scoring?.mode ?? 'all_or_nothing',
          wrongPenalty: version.scoring?.wrong_penalty ?? 0,
        },
      })
    } else {
      form.resetForm({
        values: {
          subjectId: null,
          gradeLevel: null,
          topic: '',
          tags: [],
          difficulty: 2,
          cognitiveLevel: null,
          visibility: 'private',
          defaultPoints: 1,
          stimulusId: null,
          scoringMode: 'all_or_nothing',
          wrongPenalty: 0,
        },
      })
      const preset =
        typeof route.query.type === 'string' && typeOf(route.query.type) ? route.query.type : null
      if (preset) chooseType(preset)
    }
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
    // Perubahan setelah titik ini dianggap belum disimpan.
    setTimeout(() => (dirty.value = false))
  }
}

onMounted(() => {
  if (auth.isPlatformUser) {
    loading.value = false
    return
  }
  load()
})

watch([model, explanation, () => form.values], () => (dirty.value = true), { deep: true })

// ---- Susun data & kirim ----
function collect(meta) {
  return {
    ...meta,
    typeCode: typeCode.value,
    content: model.value.content,
    answerKey: model.value.answerKey,
    explanation: explanation.value,
    scoring: buildScoring(typeCode.value, {
      mode: meta.scoringMode,
      wrongPenalty: meta.wrongPenalty,
    }),
  }
}

/** Tampilkan error backend: metadata ke field form, path isi soal ke editor jenis. */
function showErrors(error) {
  formError.value = ''
  serverErrors.value = {}
  if (error?.hasFieldErrors) {
    applyServerErrors(error)
    const contentErrors = Object.fromEntries(
      Object.entries(error.fieldErrors).filter(([path]) =>
        /^(content|answer_key|scoring)\b/.test(path),
      ),
    )
    serverErrors.value = contentErrors
    formError.value = 'Periksa kembali isian yang ditandai.'
    const messages = Object.values(contentErrors)
    if (messages.length) formError.value = `Periksa isi soal: ${messages[0]}`
  } else {
    formError.value = error?.message ?? 'Terjadi kesalahan'
  }
}

// ---- Pratinjau (validasi di server tanpa menyimpan) ----
const previewOpen = ref(false)
const previewLoading = ref(false)
const preview = ref(null)
const previewAnswer = ref(null)
const seed = ref(1)

async function runPreview(nextSeed = seed.value) {
  const { valid } = await form.validate()
  if (!valid) {
    formError.value = 'Lengkapi informasi soal yang ditandai sebelum pratinjau.'
    return
  }
  previewLoading.value = true
  seed.value = nextSeed
  try {
    const meta = questionMetaSchema.parse(form.values)
    const result = await validateQuestion(collect(meta), { seed: nextSeed })
    preview.value = result.preview
    previewAnswer.value = null
    serverErrors.value = {}
    formError.value = ''
    previewOpen.value = true
  } catch (error) {
    showErrors(error)
    previewOpen.value = false
  } finally {
    previewLoading.value = false
  }
}

// ---- Simpan ----
const save = form.handleSubmit(
  async (meta) => {
    try {
      const values = collect(meta)
      const saved = isEdit.value
        ? await updateQuestion(questionId.value, values)
        : await createQuestion(values)
      dirty.value = false
      const newVersion =
        isEdit.value && saved.currentVersion?.versionNo !== question.value.currentVersion.versionNo
      notify.success(
        isEdit.value
          ? newVersion
            ? `Soal disimpan sebagai versi ${saved.currentVersion.versionNo}`
            : 'Soal berhasil diperbarui'
          : 'Soal berhasil ditambahkan sebagai draf',
      )
      router.replace({ name: 'question-detail', params: { id: saved.id } })
    } catch (error) {
      showErrors(error)
    }
  },
  () => (formError.value = 'Lengkapi informasi soal yang ditandai.'),
)

onBeforeRouteLeave(async () => {
  if (!dirty.value || !typeCode.value) return true
  return ask({
    header: 'Perubahan belum disimpan',
    message: 'Soal yang sedang ditulis belum disimpan. Tinggalkan halaman ini?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    danger: true,
  })
})
</script>

<template>
  <div class="page">
    <PageHeader
      :title="isEdit ? 'Ubah soal' : 'Tambah soal'"
      :description="type ? type.label : 'Pilih jenis soal untuk mulai menulis'"
    >
      <template #actions>
        <Button label="Batal" severity="secondary" text @click="router.back()" />
        <Button
          v-if="typeCode"
          label="Pratinjau"
          icon="pi pi-eye"
          severity="secondary"
          outlined
          :loading="previewLoading"
          @click="runPreview(seed)"
        />
        <Button
          v-if="typeCode"
          label="Simpan"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
          @click="save"
        />
      </template>
    </PageHeader>

    <EmptyState
      v-if="auth.isPlatformUser"
      icon="pi pi-lock"
      title="Hanya untuk pengguna sekolah"
      description="Soal dibuat dan diubah oleh guru atau admin sekolah. Admin platform hanya dapat melihat bank soal."
    />
    <div v-else-if="loading" class="center-block"><ProgressSpinner style="width: 3rem" /></div>
    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Gagal memuat"
      :description="loadError.message"
    >
      <Button label="Coba lagi" icon="pi pi-refresh" @click="load" />
    </EmptyState>

    <template v-else>
      <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
      <Message v-if="locked" severity="warn" :closable="false">
        Versi {{ question.currentVersion.versionNo }} sudah dipakai ujian dan terkunci. Menyimpan
        perubahan membuat versi baru; ujian lama tetap memakai versi lama.
      </Message>

      <!-- Jenis soal -->
      <Card v-if="!isEdit">
        <template #title>Jenis soal</template>
        <template #content>
          <div class="type-grid" role="radiogroup" aria-label="Jenis soal">
            <button
              v-for="t in typeOptions"
              :key="t.code"
              type="button"
              class="type-card"
              :class="{ 'is-selected': typeCode === t.code }"
              role="radio"
              :aria-checked="typeCode === t.code"
              @click="changeType(t.code)"
            >
              <i :class="t.icon" aria-hidden="true" />
              <span>{{ t.name }}</span>
              <small class="text-muted">{{
                t.grading === 'auto' ? 'Otomatis' : t.grading === 'manual' ? 'Manual' : 'Hibrida'
              }}</small>
            </button>
          </div>
        </template>
      </Card>

      <div v-if="typeCode" class="question-form">
        <!-- Isi soal -->
        <Card class="question-form__main">
          <template #title>Isi soal · {{ type.label }}</template>
          <template #content>
            <component
              :is="editor"
              v-model="model"
              :errors="serverErrors"
              :upload-image="uploadQuestionImage"
              :points="defaultPoints"
            />
          </template>
        </Card>

        <!-- Informasi soal -->
        <Card class="question-form__side">
          <template #title>Informasi soal</template>
          <template #content>
            <div class="form-stack">
              <FormSelect
                name="subjectId"
                label="Mata pelajaran"
                :options="subjectOptions"
                placeholder="Pilih mata pelajaran"
                required
              />
              <div class="form-grid">
                <FormInputNumber name="gradeLevel" label="Tingkat" :min="1" :max="13" />
                <FormInputNumber
                  name="defaultPoints"
                  label="Bobot"
                  :min="0"
                  :max="9999"
                  :step="1"
                  required
                />
              </div>
              <FormInputText name="topic" label="Topik" placeholder="Perangkat keras komputer" />
              <FormField
                id="q-tags"
                label="Tag"
                :error="tagsField.errorMessage.value"
                hint="Maks 20; dipakai untuk menyaring."
              >
                <TagInput
                  v-model="tagsField.value.value"
                  input-id="q-tags"
                  :max="20"
                  :max-length="50"
                  :normalize="(v) => v.toLowerCase()"
                />
              </FormField>
              <div class="form-grid">
                <FormSelect
                  name="difficulty"
                  label="Kesulitan"
                  :options="DIFFICULTY_OPTIONS"
                  show-clear
                />
                <FormSelect
                  name="cognitiveLevel"
                  label="Level kognitif"
                  :options="COGNITIVE_LEVELS"
                  show-clear
                />
              </div>
              <FormSelect
                name="visibility"
                label="Visibilitas"
                :options="VISIBILITY_OPTIONS"
                :hint="VISIBILITY_OPTIONS.find((v) => v.value === form.values.visibility)?.hint"
              />
              <FormSelect
                name="stimulusId"
                label="Teks bacaan"
                :options="stimulusOptions"
                placeholder="Tanpa teks bacaan"
                hint="Untuk soal bergaya AKM: satu bacaan dipakai beberapa soal."
                show-clear
              />

              <h3 class="form-section-title">Penilaian</h3>
              <SelectButton
                v-if="scoringChoices.length > 1"
                v-model="scoringMode.value.value"
                :options="scoringChoices"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                aria-label="Mode skor"
              />
              <p v-else class="text-muted" style="margin: 0">
                Nilai penuh hanya bila jawaban benar.
              </p>
              <div v-if="type.penalty" class="form-field">
                <label class="form-field__label" for="q-penalty"
                  >Penalti jawaban salah (0–1 × bobot)</label
                >
                <InputNumber
                  v-model="wrongPenalty.value.value"
                  input-id="q-penalty"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :min-fraction-digits="0"
                  :max-fraction-digits="2"
                  show-buttons
                  fluid
                />
                <small class="form-field__hint"
                  >0 = tanpa penalti. Jawaban kosong tidak dikurangi.</small
                >
              </div>
              <small
                v-for="(msg, path) in serverErrors"
                v-show="path.startsWith('scoring')"
                :key="path"
                class="form-field__error"
              >
                {{ msg }}
              </small>
            </div>
          </template>
        </Card>

        <!-- Pembahasan -->
        <Card class="question-form__main">
          <template #title>Pembahasan (opsional)</template>
          <template #subtitle>Tidak ditampilkan kepada siswa selama ujian.</template>
          <template #content>
            <RichTextEditor
              v-model="explanation"
              :upload-image="uploadQuestionImage"
              min-height="5rem"
              placeholder="Jelaskan jawaban yang benar…"
            />
          </template>
        </Card>
      </div>
    </template>

    <Drawer
      v-model:visible="previewOpen"
      header="Pratinjau tampilan siswa"
      position="right"
      class="preview-drawer"
    >
      <div v-if="preview" class="form-stack">
        <div class="toolbar">
          <span class="text-muted">Urutan acak #{{ seed }}</span>
          <Button
            label="Acak ulang"
            icon="pi pi-refresh"
            size="small"
            text
            :loading="previewLoading"
            @click="runPreview(seed + 1)"
          />
        </div>
        <QuestionPreview v-model:answer="previewAnswer" :question="preview" />
        <Message severity="secondary" :closable="false">
          Jawaban di pratinjau tidak disimpan dan tidak dinilai.
        </Message>
      </div>
    </Drawer>
  </div>
</template>
