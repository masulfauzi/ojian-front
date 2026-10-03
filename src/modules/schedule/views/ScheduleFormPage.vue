<script setup>
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import FormDateTimePicker from '@/shared/components/form/FormDateTimePicker.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { timezoneAbbr } from '@/shared/constants/timezones'
import { fromZonedInput, toZonedISO } from '@/shared/utils/zonedTime'
import { useAuthStore } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import { listExamOptions } from '@/modules/exam'
import { createSchedule, getSchedule, updateSchedule } from '../api/schedule.api'
import { useSchoolTimezone } from '../composables/useSchoolTimezone'
import {
  CATEGORY_OPTIONS,
  RESULT_VISIBILITY_OPTIONS,
  REVIEW_VISIBILITY_OPTIONS,
  SCORE_POLICY_OPTIONS,
} from '../constants'
import { emptySchedule, scheduleSchema, windowMinutes } from '../schemas/schedule.schema'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const schoolTz = useSchoolTimezone(school.scopeId, school.ready)

const isEdit = computed(() => Boolean(route.params.id))
const schedule = ref(null)
const exams = ref([])
const loadError = ref(null)
const loaded = ref(false)
const saved = ref(false)

const timezone = computed(() => schedule.value?.timezone ?? schoolTz.timezone.value)
const published = computed(() => schedule.value && schedule.value.status !== 'draft')
// Setelah ada pengerjaan beberapa pengaturan dikunci (jadwal-ujian.md §10.4).
const locked = computed(() => Boolean(schedule.value?.hasAttempts))

const form = useForm({ validationSchema: toTypedSchema(scheduleSchema) })
const applyServerErrors = useServerErrors(form, { statusFields: { 409: 'startsAt' } })
const values = computed(() => form.values)

const examOptions = computed(() => {
  const list = exams.value.map((e) => ({
    value: e.id,
    label: `${e.title} — ${e.subjectName ?? ''} (${e.questionCount} soal)`,
  }))
  // Paket jadwal lama mungkin sudah diarsipkan: tetap tampilkan.
  if (schedule.value && !list.some((o) => o.value === schedule.value.examId))
    list.unshift({ value: schedule.value.examId, label: schedule.value.examTitle })
  return list
})
const semesterOptions = computed(() =>
  calendar.semesters.value.map((s) => ({ value: s.id, label: s.label })),
)

const windowLength = computed(() => windowMinutes(values.value.startsAt, values.value.endsAt))
const durationWarning = computed(
  () => windowLength.value !== null && values.value.durationMinutes > windowLength.value,
)

/** Besok 07.00 di zona sekolah. */
function defaultStart(tz) {
  const d = new Date()
  return fromZonedInput(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 7, 0), tz)
}

function toFormValues(s) {
  return {
    examId: s.examId,
    semesterId: s.semesterId,
    title: s.title,
    category: s.category,
    startsAt: toZonedISO(s.startsAt, s.timezone),
    endsAt: toZonedISO(s.endsAt, s.timezone),
    durationMinutes: s.durationMinutes,
    hardDeadline: s.hardDeadline,
    shuffleQuestions: s.shuffleQuestions,
    shuffleOptions: s.shuffleOptions,
    tokenEnabled: s.tokenEnabled,
    tokenLength: s.tokenLength,
    tokenRotateMinutes: s.tokenRotateMinutes,
    maxAttempts: s.maxAttempts,
    scorePolicy: s.scorePolicy,
    passingScore: s.passingScore,
    resultVisibility: s.resultVisibility,
    reviewVisibility: s.reviewVisibility,
  }
}

async function load() {
  loadError.value = null
  loaded.value = false
  try {
    const [examList, existing] = await Promise.all([
      listExamOptions(scope()).catch(() => []),
      isEdit.value ? getSchedule(route.params.id, scope()) : null,
    ])
    exams.value = examList
    schedule.value = existing
    if (existing) {
      if (!existing.canEdit || existing.status === 'cancelled') {
        loadError.value = { message: 'Jadwal ini tidak dapat diubah.' }
        return
      }
      form.resetForm({ values: toFormValues(existing) })
    } else {
      const tz = schoolTz.timezone.value
      const start = defaultStart(tz)
      const exam = examList.find((e) => e.id === route.query.exam)
      form.resetForm({
        values: {
          ...emptySchedule(),
          examId: exam?.id ?? null,
          title: exam?.title ?? '',
          semesterId: calendar.activeSemester.value?.id ?? null,
          startsAt: start,
          endsAt: toZonedISO(Date.parse(start) + 2 * 3600e3, tz),
        },
      })
    }
    loaded.value = true
  } catch (error) {
    loadError.value = error
  }
}

watch(
  // Jadwal yang diubah memakai zonanya sendiri: tidak perlu menunggu (dan tidak dimuat ulang
  // saat) zona sekolah selesai diambil.
  () => [route.params.id, school.ready.value, isEdit.value || schoolTz.loaded.value],
  ([, ready, tzReady]) => ready && tzReady && load(),
  { immediate: true },
)

// Semester aktif dimuat terpisah: isi bila belum dipilih.
watch(
  () => calendar.activeSemester.value,
  (active) => {
    if (!isEdit.value && loaded.value && !values.value.semesterId && active)
      form.setFieldValue('semesterId', active.id)
  },
)

// Judul otomatis dari paket bila belum diisi.
watch(
  () => values.value.examId,
  (id) => {
    const exam = exams.value.find((e) => e.id === id)
    if (exam && !values.value.title) form.setFieldValue('title', exam.title)
  },
)

const onSubmit = form.handleSubmit(async (formValues) => {
  try {
    const result = isEdit.value
      ? await updateSchedule(schedule.value.id, formValues, scope())
      : await createSchedule(formValues, scope())
    saved.value = true
    notify.success(
      isEdit.value
        ? 'Jadwal diperbarui'
        : 'Jadwal dibuat sebagai draf. Pilih kelas peserta lalu publikasikan.',
    )
    router.replace({
      name: 'schedule-detail',
      params: { id: result.id },
      query: route.query.school_id ? { school_id: route.query.school_id } : {},
    })
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})

onBeforeRouteLeave(async () => {
  if (saved.value || !form.meta.value.dirty) return true
  return ask({
    header: 'Perubahan belum disimpan',
    message: 'Pengaturan jadwal belum disimpan. Tinggalkan halaman ini?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Tinggalkan',
    danger: true,
  })
})

const back = () =>
  isEdit.value
    ? router.push({ name: 'schedule-detail', params: { id: route.params.id }, query: route.query })
    : router.push({ name: 'schedules' })
</script>

<template>
  <div class="page">
    <PageHeader
      :title="isEdit ? 'Ubah jadwal' : 'Buat jadwal ujian'"
      :description="`Waktu diisi menurut zona sekolah (${timezoneAbbr(timezone)})`"
    >
      <template #actions>
        <Button label="Batal" severity="secondary" text @click="back" />
        <Button
          type="submit"
          form="schedule-form"
          :label="isEdit ? 'Simpan' : 'Buat jadwal'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="!loaded || form.isSubmitting.value"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="auth.isPlatformUser && !isEdit"
      icon="pi pi-lock"
      title="Hanya pengguna sekolah yang dapat membuat jadwal"
    />
    <EmptyState
      v-else-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Jadwal tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!loaded && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>

    <form v-else-if="loaded" id="schedule-form" class="question-form" novalidate @submit="onSubmit">
      <div class="question-form__main form-stack">
        <Message v-if="locked" severity="warn" :closable="false" icon="pi pi-lock">
          Sudah ada siswa yang mengerjakan: waktu mulai, durasi, pengacakan, dan token tidak bisa
          diubah lagi. Waktu selesai hanya bisa diperpanjang dan kesempatan hanya bisa dinaikkan.
        </Message>
        <Message v-else-if="published" severity="info" :closable="false">
          Jadwal sudah dipublikasikan: paket dan semester tidak dapat diganti.
        </Message>

        <Card>
          <template #title>Paket dan waktu</template>
          <template #content>
            <div class="form-grid">
              <FormSelect
                class="form-grid__full"
                name="examId"
                label="Paket ujian"
                :options="examOptions"
                placeholder="Pilih paket yang sudah dipublikasikan"
                :disabled="published"
                :hint="exams.length ? '' : 'Belum ada paket yang dipublikasikan.'"
                required
              />
              <FormInputText
                class="form-grid__full"
                name="title"
                label="Judul jadwal"
                placeholder="PTS Informatika X — Sesi 1"
                required
              />
              <FormSelect
                name="semesterId"
                label="Semester"
                :options="semesterOptions"
                :disabled="published"
                required
              />
              <FormSelect name="category" label="Kategori" :options="CATEGORY_OPTIONS" required />
              <FormDateTimePicker
                name="startsAt"
                label="Dibuka"
                :timezone="timezone"
                :disabled="locked"
                hint="Siswa bisa mulai mengerjakan sejak waktu ini."
                required
              />
              <FormDateTimePicker
                name="endsAt"
                label="Ditutup"
                :timezone="timezone"
                hint="Batas terakhir memulai dan mengumpulkan."
                required
              />
              <FormInputNumber
                name="durationMinutes"
                label="Durasi pengerjaan (menit)"
                :min="1"
                :max="600"
                :disabled="locked"
                hint="Dihitung sejak siswa menekan Mulai."
                required
              />
              <FormSwitch
                name="hardDeadline"
                label="Batas keras"
                on-label="Tidak melewati waktu tutup"
                off-label="Durasi penuh walau lewat waktu tutup"
              />
            </div>
            <Message v-if="durationWarning" severity="warn" :closable="false" class="form-note">
              Durasi ({{ values.durationMinutes }} menit) lebih panjang dari jendela waktu ({{
                windowLength
              }}
              menit). Dengan batas keras, siswa yang mulai terlambat mendapat waktu lebih sedikit.
            </Message>
          </template>
        </Card>

        <Card>
          <template #title>Hasil dan penilaian</template>
          <template #content>
            <div class="form-grid">
              <FormInputNumber
                name="maxAttempts"
                label="Kesempatan mengerjakan"
                :min="1"
                :max="10"
                required
              />
              <FormSelect
                name="scorePolicy"
                label="Nilai yang dipakai"
                :options="SCORE_POLICY_OPTIONS"
                :disabled="values.maxAttempts <= 1"
                required
              />
              <FormInputNumber
                name="passingScore"
                label="KKM (%)"
                :min="0"
                :max="100"
                hint="Batas lulus dan dasar remedial. Kosongkan bila tidak ada."
              />
              <div />
              <FormSelect
                name="resultVisibility"
                label="Nilai terlihat oleh siswa"
                :options="RESULT_VISIBILITY_OPTIONS"
                required
              />
              <FormSelect
                name="reviewVisibility"
                label="Pembahasan terlihat oleh siswa"
                :options="REVIEW_VISIBILITY_OPTIONS"
                hint="Jawaban benar dan pembahasan tiap soal."
                required
              />
            </div>
          </template>
        </Card>
      </div>

      <div class="question-form__side form-stack">
        <Card>
          <template #title>Pengacakan</template>
          <template #content>
            <div class="form-stack">
              <FormSwitch
                name="shuffleQuestions"
                label="Urutan soal"
                on-label="Diacak per siswa"
                off-label="Sesuai paket"
                :disabled="locked"
                hint="Bagian tidak tercampur; soal satu teks bacaan tetap berurutan."
              />
              <FormSwitch
                name="shuffleOptions"
                label="Urutan pilihan jawaban"
                on-label="Diacak per siswa"
                off-label="Sesuai soal"
                :disabled="locked"
              />
            </div>
          </template>
        </Card>
        <Card>
          <template #title>Token</template>
          <template #content>
            <div class="form-stack">
              <FormSwitch
                name="tokenEnabled"
                label="Wajib token saat mulai"
                on-label="Ya"
                off-label="Tidak"
                :disabled="locked"
                hint="Pengawas membacakan token dari halaman Pemantauan."
              />
              <template v-if="values.tokenEnabled">
                <FormInputNumber name="tokenLength" label="Panjang token" :min="4" :max="10" />
                <FormInputNumber
                  name="tokenRotateMinutes"
                  label="Ganti token tiap (menit)"
                  :min="1"
                  :max="240"
                  hint="Kosongkan agar token tetap. Disarankan minimal 5 menit."
                />
              </template>
            </div>
          </template>
        </Card>
      </div>
    </form>
  </div>
</template>
