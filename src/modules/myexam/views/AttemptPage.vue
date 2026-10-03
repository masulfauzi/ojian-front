<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import ProgressSpinner from 'primevue/progressspinner'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useCountdown } from '@/shared/composables/useCountdown'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDuration } from '@/shared/utils/zonedTime'
import { QuestionPreview } from '@/modules/questionbank'
import QuestionNavigator from '../components/QuestionNavigator.vue'
import { useAttemptStore } from '../stores/attempt.store'

const WARN_SECONDS = 300

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const { ask } = useConfirm()
const store = useAttemptStore()

const loading = ref(true)
const loadError = ref(null)
const index = ref(0)
const navOpen = ref(false)
const submitting = ref(false)
let warned = false

const countdown = useCountdown({ onExpire: () => finish('timeout') })

const questions = computed(() => store.questions)
const question = computed(() => questions.value[index.value] ?? null)
const section = computed(() =>
  store.attempt?.sections.find((s) => s.no === question.value?.sectionNo),
)
/** Instruksi bagian ditampilkan pada soal pertama tiap bagian. */
const firstOfSection = computed(
  () =>
    index.value === 0 || questions.value[index.value - 1]?.sectionNo !== question.value?.sectionNo,
)
const seconds = computed(() => countdown.seconds.value)
const lowTime = computed(() => seconds.value !== null && seconds.value <= WARN_SECONDS)

const saveStatus = computed(() => {
  if (store.errorCount)
    return {
      icon: 'pi pi-exclamation-triangle',
      text: 'Gagal tersimpan, mencoba lagi…',
      cls: 'is-error',
    }
  if (store.pendingCount) return { icon: 'pi pi-spin pi-spinner', text: 'Menyimpan…', cls: '' }
  if (store.lastSavedAt) return { icon: 'pi pi-check', text: 'Tersimpan', cls: 'is-ok' }
  return null
})

const answer = computed({
  get: () => store.answers[question.value.examQuestionId] ?? null,
  set: (value) => store.setAnswer(question.value.examQuestionId, value),
})

async function load() {
  loading.value = true
  loadError.value = null
  try {
    await store.load(route.params.id)
    if (store.ended) {
      router.replace({ name: 'attempt-result', params: { id: route.params.id } })
      return
    }
    countdown.sync(store.remainingSeconds)
    // Lanjutkan dari soal pertama yang belum dijawab.
    const firstOpen = store.questions.findIndex((q) => !store.answeredOf(q))
    index.value = firstOpen === -1 ? 0 : firstOpen
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}

watch(
  () => store.serverSync,
  () => countdown.sync(store.remainingSeconds),
)
watch(seconds, (left) => {
  if (left !== null && left <= WARN_SECONDS && left > 0 && !warned) {
    warned = true
    notify.warn('Sisa waktu 5 menit. Periksa kembali jawaban Anda.', 'Waktu hampir habis')
  }
})
// Pengerjaan diakhiri server (409: waktu habis / dikumpulkan pengawas).
watch(
  () => store.ended,
  (ended) => {
    if (ended && store.endReason === 'expired' && !submitting.value) finish('expired')
  },
)

function go(next) {
  index.value = Math.min(Math.max(0, next), questions.value.length - 1)
  navOpen.value = false
}

async function finish(reason) {
  if (submitting.value) return
  submitting.value = true
  countdown.stop()
  try {
    if (reason !== 'expired') await store.submit()
    notify.info(
      reason === 'timeout' || reason === 'expired'
        ? 'Waktu habis. Pengerjaan dikumpulkan otomatis.'
        : 'Pengerjaan berhasil dikumpulkan.',
      'Selesai',
    )
  } catch (error) {
    // 409: sudah dikumpulkan (otomatis oleh server/pengawas) — tetap ke halaman hasil.
    if (error?.status !== 409) {
      submitting.value = false
      notify.error(error)
      return
    }
  }
  router.replace({ name: 'attempt-result', params: { id: route.params.id } })
}

async function confirmSubmit() {
  await store.flushAll()
  const { unanswered, flagged } = store.stats
  const notes = [
    unanswered && `${unanswered} soal belum dijawab`,
    flagged && `${flagged} soal masih ditandai ragu-ragu`,
  ].filter(Boolean)
  const ok = await ask({
    header: 'Kumpulkan jawaban',
    message: `${notes.length ? `${notes.join(' dan ')}. ` : 'Semua soal sudah dijawab. '}Setelah dikumpulkan, jawaban tidak bisa diubah. Kumpulkan sekarang?`,
    icon: notes.length ? 'pi pi-exclamation-triangle' : 'pi pi-send',
    acceptLabel: 'Kumpulkan',
    rejectLabel: 'Periksa lagi',
  })
  if (ok) finish('manual')
}

// Peringatan menutup tab selagi ada jawaban yang belum terkirim.
function beforeUnload(event) {
  if (store.pendingCount || store.errorCount) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  load()
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  countdown.stop()
})

onBeforeRouteLeave(async (to) => {
  if (store.ended || to.name === 'attempt-result') return true
  await store.flushAll().catch(() => {})
  return ask({
    header: 'Tinggalkan ujian?',
    message:
      'Waktu tetap berjalan. Anda bisa melanjutkan dari menu Ujian Saya selama waktu masih ada.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    rejectLabel: 'Tetap di sini',
  })
})
</script>

<template>
  <div class="attempt-page">
    <header class="attempt-bar">
      <div class="attempt-bar__title">
        <strong>{{ store.attempt?.title ?? 'Ujian' }}</strong>
        <span v-if="saveStatus" class="attempt-save" :class="saveStatus.cls" role="status">
          <i :class="saveStatus.icon" aria-hidden="true" /> {{ saveStatus.text }}
        </span>
      </div>
      <div
        v-if="seconds !== null"
        class="attempt-timer"
        :class="{ 'is-low': lowTime }"
        role="timer"
        :aria-label="`Sisa waktu ${formatDuration(seconds)}`"
      >
        <i class="pi pi-clock" aria-hidden="true" /> {{ formatDuration(seconds) }}
      </div>
      <div class="attempt-bar__actions">
        <Button
          class="attempt-nav-toggle"
          icon="pi pi-th-large"
          :label="`${store.stats.answered}/${store.stats.total}`"
          severity="secondary"
          outlined
          aria-label="Daftar nomor soal"
          @click="navOpen = true"
        />
        <Button
          label="Kumpulkan"
          icon="pi pi-send"
          :loading="submitting"
          :disabled="loading || !!loadError"
          @click="confirmSubmit"
        />
      </div>
    </header>

    <div v-if="loading" class="center-block"><ProgressSpinner style="width: 3rem" /></div>
    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Pengerjaan tidak dapat dimuat"
      :description="loadError.message"
    >
      <Button
        label="Ujian Saya"
        icon="pi pi-arrow-left"
        @click="router.push({ name: 'my-exams' })"
      />
    </EmptyState>

    <main v-else-if="question" class="attempt-body">
      <section class="attempt-question" :aria-label="`Soal nomor ${question.number}`">
        <div
          v-if="firstOfSection && section && (section.title || section.instruction)"
          class="attempt-section"
        >
          <strong v-if="section.title">{{ section.title }}</strong>
          <span v-if="section.instruction">{{ section.instruction }}</span>
        </div>
        <div class="attempt-question__head">
          <span class="attempt-question__no">Soal {{ question.number }}</span>
          <span class="text-muted">{{ question.points }} poin</span>
          <Button
            :label="store.flags[question.examQuestionId] ? 'Ragu-ragu' : 'Tandai ragu-ragu'"
            :icon="store.flags[question.examQuestionId] ? 'pi pi-flag-fill' : 'pi pi-flag'"
            :severity="store.flags[question.examQuestionId] ? 'warn' : 'secondary'"
            size="small"
            :outlined="!store.flags[question.examQuestionId]"
            :aria-pressed="Boolean(store.flags[question.examQuestionId])"
            @click="store.toggleFlag(question.examQuestionId)"
          />
        </div>
        <p v-if="question.type === 'ordering' && !store.answeredOf(question)" class="text-muted">
          Seret item untuk mengurutkan. Soal dianggap terjawab setelah urutan Anda ubah.
        </p>
        <QuestionPreview
          :key="question.examQuestionId"
          v-model:answer="answer"
          :question="question"
          :disabled="store.ended"
        />
        <div class="attempt-question__nav">
          <Button
            label="Sebelumnya"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            :disabled="index === 0"
            @click="go(index - 1)"
          />
          <Button
            v-if="index < questions.length - 1"
            label="Berikutnya"
            icon="pi pi-arrow-right"
            icon-pos="right"
            @click="go(index + 1)"
          />
          <Button v-else label="Selesai & kumpulkan" icon="pi pi-send" @click="confirmSubmit" />
        </div>
      </section>

      <aside class="attempt-side">
        <QuestionNavigator
          :questions="questions"
          :current="index"
          :is-answered="store.answeredOf"
          :flags="store.flags"
          :save-state="store.saveState"
          @select="go"
        />
      </aside>
    </main>

    <Drawer v-model:visible="navOpen" header="Nomor soal" position="right">
      <QuestionNavigator
        :questions="questions"
        :current="index"
        :is-answered="store.answeredOf"
        :flags="store.flags"
        :save-state="store.saveState"
        @select="go"
      />
    </Drawer>
  </div>
</template>
