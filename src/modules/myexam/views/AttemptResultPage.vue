<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { formatNumber } from '@/shared/utils/format'
import { AnswerKeySummary, QuestionHtml, QuestionPreview } from '@/modules/questionbank'
import { getAttemptResult } from '../api/myexam.api'

// Hasil pengerjaan siswa: skor sesuai result_visibility, pembahasan sesuai review_visibility.
const route = useRoute()
const router = useRouter()

const result = ref(null)
const loadError = ref(null)
const loading = ref(true)

async function load() {
  loading.value = true
  loadError.value = null
  try {
    result.value = await getAttemptResult(route.params.id)
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}
onMounted(load)

const fmt = (value) => (value === null ? '-' : formatNumber(value, { maximumFractionDigits: 2 }))
const scoreSeverity = (item) =>
  item.score === null
    ? 'secondary'
    : item.score >= item.maxScore
      ? 'success'
      : item.score > 0
        ? 'warn'
        : 'danger'
</script>

<template>
  <div class="page">
    <PageHeader title="Hasil ujian">
      <template #actions>
        <Button
          label="Ujian Saya"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'my-exams' })"
        />
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

    <div v-if="loading && !result" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>
    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Hasil tidak dapat dimuat"
      :description="loadError.message"
    />
    <template v-else-if="result">
      <Card class="result-hero">
        <template #content>
          <div v-if="result.scoreVisible" class="result-hero__score">
            <span class="result-hero__value">{{ fmt(result.scorePercent) }}</span>
            <span class="text-muted">
              {{ fmt(result.totalScore) }} dari {{ fmt(result.maxScore) }} poin
            </span>
            <Tag
              v-if="result.passed !== null"
              :value="result.passed ? 'Lulus' : 'Belum lulus'"
              :severity="result.passed ? 'success' : 'danger'"
            />
          </div>
          <div v-else class="result-hero__score">
            <i class="pi pi-hourglass result-hero__icon" aria-hidden="true" />
            <span class="result-hero__message">{{
              result.message || 'Nilai belum dapat ditampilkan'
            }}</span>
          </div>
          <p class="text-muted result-hero__note">
            Pengerjaan sudah dikumpulkan. Jawaban Anda tersimpan.
          </p>
        </template>
      </Card>

      <template v-if="result.review.length">
        <h2 class="form-section-title">Pembahasan</h2>
        <Card v-for="item in result.review" :key="item.examQuestionId" class="review-card">
          <template #title>
            <div class="toolbar">
              <span>Soal {{ item.number }}</span>
              <Tag
                v-if="item.score !== null"
                :value="`${fmt(item.score)} / ${fmt(item.maxScore)}`"
                :severity="scoreSeverity(item)"
              />
              <Tag v-else value="Menunggu penilaian" severity="warn" />
            </div>
          </template>
          <template #content>
            <QuestionPreview
              :question="{ type: item.type, content: item.content, stimulus: item.stimulus }"
              :answer="item.answer"
              disabled
            />
            <template v-if="item.answerKey">
              <h3 class="form-section-title">Kunci jawaban</h3>
              <AnswerKeySummary
                :type-code="item.type"
                :content="item.content"
                :answer-key="item.answerKey"
              />
            </template>
            <div v-if="item.feedback" class="review-feedback">
              <strong>Umpan balik guru:</strong> {{ item.feedback }}
            </div>
            <template v-if="item.explanation">
              <h3 class="form-section-title">Pembahasan</h3>
              <QuestionHtml :html="item.explanation" />
            </template>
          </template>
        </Card>
      </template>
    </template>
  </div>
</template>
