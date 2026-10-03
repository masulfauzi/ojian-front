<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { AnswerKeySummary, QuestionPreview, typeLabel } from '@/modules/questionbank'
import { listGradingQueue, scoreAnswer } from '../api/grading.api'
import { criteriaTotal, criteriaValid, rubricOf } from '../utils/rubric'

// Antrian penilaian manual: satu jawaban per layar (soal, jawaban siswa, kunci/rubrik, skor).
const props = defineProps({
  scheduleId: { type: String, required: true },
  schoolId: { type: String, default: null },
  canGrade: { type: Boolean, default: false },
})
const emit = defineEmits(['graded'])
const notify = useNotify()

const PAGE = 20
const queue = ref([])
const total = ref(0)
const index = ref(0)
const loading = ref(false)
const saving = ref(false)
const score = ref(null)
const criteria = ref({})
const feedback = ref('')
const error = ref('')

const current = computed(() => queue.value[index.value] ?? null)
const rubric = computed(() =>
  current.value ? rubricOf(current.value.type, current.value.answerKey) : [],
)
const useRubric = computed(() => rubric.value.length > 0)
const valueToSave = computed(() => (useRubric.value ? criteriaTotal(criteria.value) : score.value))
const valid = computed(() =>
  useRubric.value
    ? criteriaValid(rubric.value, criteria.value)
    : typeof score.value === 'number' && score.value >= 0 && score.value <= current.value.maxScore,
)

async function load() {
  loading.value = true
  try {
    const result = await listGradingQueue({
      schoolId: props.schoolId,
      scheduleId: props.scheduleId,
      limit: PAGE,
    })
    queue.value = result.items
    total.value = result.meta.total
    index.value = 0
  } catch (err) {
    notify.error(err)
  } finally {
    loading.value = false
  }
}

watch(() => props.scheduleId, load, { immediate: true })

watch(current, (item) => {
  error.value = ''
  feedback.value = ''
  criteria.value = {}
  score.value = item?.autoScore ?? null
})

async function save() {
  if (!valid.value) return
  saving.value = true
  error.value = ''
  try {
    const item = current.value
    const result = await scoreAnswer(
      item.attemptId,
      item.examQuestionId,
      {
        score: score.value,
        criteria: useRubric.value ? { ...criteria.value } : null,
        feedback: feedback.value.trim(),
      },
      { schoolId: props.schoolId },
    )
    notify.success(
      `Skor ${item.studentName} no. ${item.number}: ${result.manualScore}/${result.maxScore}`,
    )
    queue.value.splice(index.value, 1)
    total.value -= 1
    if (index.value >= queue.value.length) index.value = Math.max(0, queue.value.length - 1)
    emit('graded', result)
    if (!queue.value.length && total.value > 0) await load()
  } catch (err) {
    error.value = Object.values(err.fieldErrors ?? {})[0] ?? ''
    if (!error.value) notify.error(err)
  } finally {
    saving.value = false
  }
}

defineExpose({ reload: load })
</script>

<template>
  <div class="form-stack">
    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 2.5rem" /></div>
    <EmptyState
      v-else-if="!current"
      icon="pi pi-check-circle"
      title="Tidak ada jawaban yang perlu dinilai"
      description="Jawaban uraian dan jawaban yang perlu diperiksa muncul di sini setelah siswa mengumpulkan."
    />
    <template v-else>
      <div class="toolbar">
        <span>
          <strong>{{ total }}</strong> jawaban menunggu penilaian
        </span>
        <span class="text-muted">· {{ index + 1 }} dari {{ queue.length }} dimuat</span>
        <Button
          icon="pi pi-angle-left"
          severity="secondary"
          text
          rounded
          aria-label="Jawaban sebelumnya"
          :disabled="index === 0"
          @click="index -= 1"
        />
        <Button
          icon="pi pi-angle-right"
          severity="secondary"
          text
          rounded
          aria-label="Jawaban berikutnya"
          :disabled="index >= queue.length - 1"
          @click="index += 1"
        />
      </div>

      <div class="question-form">
        <Card class="question-form__main">
          <template #title>
            <div class="toolbar">
              <span>Soal no. {{ current.number }}</span>
              <Tag :value="typeLabel(current.type)" severity="secondary" />
              <Tag
                :value="
                  current.gradingStatus === 'needs_review' ? 'Perlu diperiksa' : 'Belum dinilai'
                "
                severity="warn"
              />
            </div>
          </template>
          <template #content>
            <p class="text-muted grading-student">
              <i class="pi pi-user" aria-hidden="true" /> {{ current.studentName }}
              <span v-if="current.nis">· {{ current.nis }}</span>
            </p>
            <QuestionPreview
              :key="`${current.attemptId}-${current.examQuestionId}`"
              :question="{ type: current.type, content: current.content }"
              :answer="current.answer"
              :school-id="schoolId"
              disabled
            />
            <h3 class="form-section-title">Kunci jawaban</h3>
            <AnswerKeySummary
              :type-code="current.type"
              :content="current.content"
              :answer-key="current.answerKey"
              :school-id="schoolId"
            />
          </template>
        </Card>

        <Card class="question-form__side">
          <template #title>Skor</template>
          <template #content>
            <div class="form-stack">
              <Message v-if="current.autoScore !== null" severity="secondary" :closable="false">
                Skor otomatis: {{ current.autoScore }} dari {{ current.maxScore }}
              </Message>
              <template v-if="useRubric">
                <div v-for="r in rubric" :key="r.id" class="form-field">
                  <label class="form-field__label" :for="`crit-${r.id}`">
                    {{ r.criterion || r.id }}
                    <span class="text-muted">(maks {{ r.maxPoints }})</span>
                  </label>
                  <InputNumber
                    v-model="criteria[r.id]"
                    :input-id="`crit-${r.id}`"
                    :min="0"
                    :max="r.maxPoints"
                    :max-fraction-digits="2"
                    show-buttons
                    :disabled="!canGrade"
                    fluid
                  />
                </div>
                <p>
                  Total: <strong>{{ valueToSave }}</strong> / {{ current.maxScore }}
                </p>
              </template>
              <div v-else class="form-field">
                <label class="form-field__label" for="grading-score"
                  >Skor (0–{{ current.maxScore }})</label
                >
                <InputNumber
                  v-model="score"
                  input-id="grading-score"
                  :min="0"
                  :max="current.maxScore"
                  :max-fraction-digits="2"
                  show-buttons
                  :disabled="!canGrade"
                  fluid
                />
              </div>
              <div class="form-field">
                <label class="form-field__label" for="grading-feedback">Umpan balik</label>
                <Textarea
                  id="grading-feedback"
                  v-model="feedback"
                  rows="3"
                  maxlength="5000"
                  placeholder="Opsional; terlihat siswa bila pembahasan dibuka"
                  :disabled="!canGrade"
                  fluid
                />
              </div>
              <small v-if="error" class="form-field__error" role="alert">{{ error }}</small>
              <Button
                v-if="canGrade"
                label="Simpan skor"
                icon="pi pi-check"
                :disabled="!valid"
                :loading="saving"
                @click="save"
              />
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
