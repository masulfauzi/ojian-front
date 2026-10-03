import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { getAttempt, saveAnswer, submitAttempt } from '../api/myexam.api'
import { answerStats, isAnswered } from '../utils/answers'

export const SAVE_DEBOUNCE_MS = 800
const RETRY_MIN_MS = 2000
const RETRY_MAX_MS = 30_000

/**
 * Keadaan satu pengerjaan siswa dan autosave jawaban.
 *
 * - Jawaban disimpan per soal setelah jeda `SAVE_DEBOUNCE_MS`; tanda ragu-ragu langsung.
 * - Hanya satu permintaan berjalan per soal; perubahan selama permintaan berjalan dikirim
 *   setelahnya (jawaban terakhir yang menang).
 * - Gagal jaringan/server → dicoba ulang dengan jeda bertambah. 409 (waktu habis/sudah
 *   dikumpulkan) → pengerjaan dianggap berakhir.
 * - `remainingSeconds` diperbarui dari setiap respons server (jam server acuan); `serverSync`
 *   bertambah setiap kali agar halaman menyelaraskan hitung mundur.
 */
export const useAttemptStore = defineStore('attempt', () => {
  const attempt = ref(null)
  const questions = ref([])
  const answers = reactive({})
  const flags = reactive({})
  /** { [examQuestionId]: 'saving' | 'saved' | 'error' } */
  const saveState = reactive({})
  const ended = ref(false)
  const endReason = ref('')
  const remainingSeconds = ref(null)
  const serverSync = ref(0)
  const lastSavedAt = ref(null)

  const timers = new Map()
  const inflight = new Map()
  const dirty = new Set()
  const retries = new Map()

  function reset() {
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
    inflight.clear()
    dirty.clear()
    retries.clear()
    for (const key of Object.keys(answers)) delete answers[key]
    for (const key of Object.keys(flags)) delete flags[key]
    for (const key of Object.keys(saveState)) delete saveState[key]
    attempt.value = null
    questions.value = []
    ended.value = false
    endReason.value = ''
    remainingSeconds.value = null
    lastSavedAt.value = null
  }

  function syncRemaining(seconds) {
    if (seconds === null || seconds === undefined) return
    remainingSeconds.value = seconds
    serverSync.value += 1
  }

  function markEnded(reason) {
    ended.value = true
    endReason.value = reason
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
  }

  /** Isi store dari AttemptView (hasil start atau GET /attempts/{id}). */
  function init(view) {
    reset()
    attempt.value = view
    questions.value = view.questions
    for (const q of view.questions) {
      answers[q.examQuestionId] = q.answer
      flags[q.examQuestionId] = q.isFlagged
    }
    if (view.status !== 'in_progress') markEnded(view.status)
    else syncRemaining(view.remainingSeconds)
  }

  async function load(id) {
    init(await getAttempt(id))
  }

  function schedule(id, delay) {
    if (ended.value) return
    clearTimeout(timers.get(id))
    saveState[id] = saveState[id] === 'error' ? 'error' : 'saving'
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id)
        flush(id)
      }, delay),
    )
  }

  async function flush(id) {
    if (ended.value) return
    if (inflight.has(id)) {
      dirty.add(id)
      return inflight.get(id)
    }
    dirty.delete(id)
    saveState[id] = 'saving'
    const request = saveAnswer(attempt.value.id, id, { answer: answers[id], isFlagged: flags[id] })
      .then((result) => {
        retries.delete(id)
        lastSavedAt.value = result.savedAt
        syncRemaining(result.remainingSeconds)
        saveState[id] = dirty.has(id) ? 'saving' : 'saved'
      })
      .catch((error) => {
        if (error?.status === 409) {
          saveState[id] = 'error'
          markEnded('expired')
          return
        }
        saveState[id] = 'error'
        // Jawaban tidak valid (400) tidak akan berhasil bila diulang.
        if (error?.status === 400 || error?.status === 422) return
        const delay = Math.min(RETRY_MAX_MS, (retries.get(id) ?? RETRY_MIN_MS / 2) * 2)
        retries.set(id, delay)
        schedule(id, delay)
      })
      .finally(() => {
        inflight.delete(id)
        if (dirty.has(id) && !ended.value) flush(id)
      })
    inflight.set(id, request)
    return request
  }

  function setAnswer(id, answer) {
    answers[id] = answer
    schedule(id, SAVE_DEBOUNCE_MS)
  }

  function toggleFlag(id) {
    flags[id] = !flags[id]
    schedule(id, 0)
  }

  /** Kirim semua jawaban yang tertunda sekarang (sebelum kumpulkan / meninggalkan halaman). */
  async function flushAll() {
    const ids = [...timers.keys()]
    for (const id of ids) {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }
    await Promise.all([...ids.map((id) => flush(id)), ...inflight.values()])
    // Perubahan yang masuk selama menunggu.
    if (inflight.size) await Promise.all([...inflight.values()])
  }

  async function submit() {
    await flushAll()
    const summary = await submitAttempt(attempt.value.id)
    markEnded('submitted')
    return summary
  }

  const pendingCount = computed(() => Object.values(saveState).filter((s) => s === 'saving').length)
  const errorCount = computed(() => Object.values(saveState).filter((s) => s === 'error').length)
  const stats = computed(() => answerStats(questions.value, answers, flags))
  const answeredOf = (q) => isAnswered(q.type, answers[q.examQuestionId])

  return {
    attempt,
    questions,
    answers,
    flags,
    saveState,
    ended,
    endReason,
    remainingSeconds,
    serverSync,
    lastSavedAt,
    pendingCount,
    errorCount,
    stats,
    answeredOf,
    init,
    load,
    reset,
    setAnswer,
    toggleFlag,
    flush,
    flushAll,
    submit,
    markEnded,
  }
})
