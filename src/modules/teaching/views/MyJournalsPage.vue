<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { monthLabel, toISODate } from '@/shared/utils/date'
import { useCan } from '@/modules/auth'
import { useSchoolContext } from '@/modules/academic'
import {
  createJournal,
  deleteJournal,
  exportMyJournals,
  getMySummary,
  listMyJournals,
  updateJournal,
} from '../api/journal.api'
import { listMySchedule } from '../api/teachingSchedule.api'
import ExportDialog from '../components/ExportDialog.vue'
import JournalFormDialog from '../components/JournalFormDialog.vue'
import JournalStudentsDialog from '../components/JournalStudentsDialog.vue'
import JournalTable from '../components/JournalTable.vue'
import SemesterSwitcher from '../components/SemesterSwitcher.vue'
import { useTeachingOptions } from '../composables/useTeachingOptions'
import { useWorkingSemester } from '../composables/useWorkingSemester'
import { isoDay, periodLabel, slotsForDay, subjectColor } from '../utils/timetable'

const PAGE_SIZE = 50
// Batas jam bawaan backend; guru tidak berhak membaca pengaturan jurnal (server tetap memvalidasi).
const MAX_PERIOD = 12

const can = useCan('my_journals')
const canSchedule = useCan('my_schedule')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  semester: { type: 'string' },
  page: { type: 'page' },
  month: { type: 'string' },
  class_id: { type: 'string' },
  subject_id: { type: 'string' },
  search: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const semester = useWorkingSemester({ query, update, school })
const options = useTeachingOptions(school, semester)
const scope = () => ({ semesterId: semester.id.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const today = toISODate(new Date())

// ---- Daftar ----
const list = usePagedList((params) => listMyJournals(params))
async function load() {
  if (!semester.id.value) return
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: PAGE_SIZE,
      month: query.value.month || undefined,
      classId: query.value.class_id || undefined,
      subjectId: query.value.subject_id || undefined,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}

// ---- Ringkasan semester ----
const summary = ref(null)
async function loadSummary() {
  if (!semester.id.value) return
  summary.value = await getMySummary(scope()).catch(() => null)
}

// ---- Jadwal hari ini (isi cepat) ----
const todaySlots = ref([])
async function loadToday() {
  if (!canSchedule.value.view || !semester.isActive.value) {
    todaySlots.value = []
    return
  }
  try {
    const { items } = await listMySchedule(scope())
    todaySlots.value = slotsForDay(items, isoDay())
  } catch {
    todaySlots.value = []
  }
}

watch(query, () => isActiveRoute() && load(), { immediate: true })
watch(
  () => semester.id.value,
  () => {
    if (isActiveRoute()) load()
    loadSummary()
    loadToday()
  },
  { immediate: true },
)
const refresh = () => Promise.all([list.reload(), loadSummary()])

const monthOptions = computed(() =>
  (summary.value?.byMonth ?? []).map((m) => ({
    value: m.month,
    label: `${monthLabel(m.month)} (${m.meetings})`,
  })),
)
/** Slot hari ini yang sudah dicatat jurnalnya (cocok kelas, mapel, jam). */
const filled = computed(() => {
  const todays = list.items.value.filter((j) => j.journalDate === today)
  return new Set(
    todaySlots.value
      .filter((s) =>
        todays.some(
          (j) =>
            j.class?.id === s.class?.id &&
            j.subject?.id === s.subject?.id &&
            j.periodFrom <= s.periodTo &&
            j.periodTo >= s.periodFrom,
        ),
      )
      .map((s) => s.id),
  )
})

// ---- Form ----
const form = ref({ visible: false, journal: null, initial: null })
function openForm(journal = null, initial = null) {
  form.value = { visible: true, journal, initial }
}
function fromSlot(slot) {
  openForm(null, {
    journalDate: today,
    classId: slot.class?.id,
    subjectId: slot.subject?.id,
    periodFrom: slot.periodFrom,
    periodTo: slot.periodTo,
  })
}
async function save(values) {
  if (form.value.journal) {
    await updateJournal(form.value.journal.id, values, scope())
    notify.success('Jurnal diperbarui')
  } else {
    await createJournal(values, scope())
    notify.success('Jurnal disimpan')
  }
  await refresh()
}
async function remove(journal) {
  if (!(await confirmDelete(`jurnal ${journal.class?.name} ${journal.subject?.name}`))) return
  try {
    await deleteJournal(journal.id)
    notify.success('Jurnal dihapus')
    await list.reloadAfterDelete()
    await loadSummary()
  } catch (error) {
    notify.error(error)
  }
}

const students = ref({ visible: false, journal: null })
const exportVisible = ref(false)
</script>

<template>
  <div class="page">
    <PageHeader title="Jurnal Mengajar" description="Catatan materi tiap pertemuan, per semester">
      <template #actions>
        <Button
          label="Unduh Excel"
          icon="pi pi-file-excel"
          severity="secondary"
          outlined
          :disabled="!semester.id.value"
          @click="exportVisible = true"
        />
        <Button
          v-if="can.create"
          label="Tambah jurnal"
          icon="pi pi-plus"
          :disabled="!semester.id.value"
          @click="openForm()"
        />
      </template>
    </PageHeader>

    <SemesterSwitcher :semester="semester" />

    <EmptyState
      v-if="school.ready.value && !semester.calendar.loading.value && !semester.id.value"
      icon="pi pi-calendar"
      title="Belum ada semester aktif"
      description="Admin sekolah perlu mengaktifkan semester terlebih dahulu."
    />

    <template v-else>
      <Card v-if="todaySlots.length && can.create" class="today-slots">
        <template #title>Jadwal hari ini</template>
        <template #subtitle
          >Klik untuk mengisi jurnal dengan kelas, mapel, dan jam yang sesuai.</template
        >
        <template #content>
          <div class="today-slots__list">
            <button
              v-for="slot in todaySlots"
              :key="slot.id"
              type="button"
              class="today-slot"
              :class="[
                `tt-color-${subjectColor(slot.subject?.id)}`,
                { 'is-done': filled.has(slot.id) },
              ]"
              :aria-label="`Isi jurnal ${slot.subject?.name} ${slot.class?.name} jam ${periodLabel(slot.periodFrom, slot.periodTo)}`"
              @click="fromSlot(slot)"
            >
              <span class="today-slot__period"
                >Jam {{ periodLabel(slot.periodFrom, slot.periodTo) }}</span
              >
              <strong>{{ slot.subject?.name }}</strong>
              <span>{{ slot.class?.name }}</span>
              <span v-if="filled.has(slot.id)" class="today-slot__done"
                ><i class="pi pi-check" aria-hidden="true" /> sudah diisi</span
              >
            </button>
          </div>
        </template>
      </Card>

      <div v-if="summary" class="stat-grid">
        <div class="stat-card">
          <span class="stat-card__label">Pertemuan semester ini</span>
          <span class="stat-card__value">{{ summary.meetings }}</span>
        </div>
        <div class="stat-card stat-card--info">
          <span class="stat-card__label">Jam pelajaran</span>
          <span class="stat-card__value">{{ summary.periods }}</span>
        </div>
        <div
          v-for="row in summary.byClassSubject.slice(0, 4)"
          :key="`${row.class?.id}${row.subject?.id}`"
          class="stat-card"
        >
          <span class="stat-card__label">{{ row.class?.name }} · {{ row.subject?.name }}</span>
          <span class="stat-card__value"
            >{{ row.meetings
            }}<small class="text-muted"> pertemuan · {{ row.periods }} JP</small></span
          >
        </div>
      </div>

      <Card>
        <template #content>
          <div class="form-stack">
            <div class="toolbar">
              <IconField class="toolbar__search">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchInput"
                  placeholder="Cari materi"
                  aria-label="Cari materi"
                  fluid
                />
              </IconField>
              <Select
                class="toolbar__filter"
                :model-value="query.month || null"
                :options="monthOptions"
                option-label="label"
                option-value="value"
                placeholder="Semua bulan"
                aria-label="Filter bulan"
                show-clear
                @update:model-value="(v) => update({ month: v ?? '', page: 1 })"
              />
              <Select
                class="toolbar__filter"
                :model-value="query.class_id || null"
                :options="options.classOptions.value"
                option-label="label"
                option-value="value"
                placeholder="Semua kelas"
                aria-label="Filter kelas"
                show-clear
                @update:model-value="(v) => update({ class_id: v ?? '', page: 1 })"
              />
              <Select
                class="toolbar__filter"
                :model-value="query.subject_id || null"
                :options="options.subjectOptions.value"
                option-label="label"
                option-value="value"
                placeholder="Semua mapel"
                aria-label="Filter mapel"
                show-clear
                @update:model-value="(v) => update({ subject_id: v ?? '', page: 1 })"
              />
            </div>
            <JournalTable
              :items="list.items.value"
              :loading="list.loading.value"
              :total="list.meta.value.total"
              :rows="PAGE_SIZE"
              :first="(query.page - 1) * PAGE_SIZE"
              empty-description="Catat materi setiap selesai mengajar. Jurnal juga menjadi dasar jadwal mengajar."
              @page="(page) => update({ page })"
            >
              <template #actions="{ journal }">
                <Button
                  v-tooltip.top="'Siswa & kehadiran'"
                  icon="pi pi-users"
                  severity="secondary"
                  text
                  rounded
                  :aria-label="`Siswa ${journal.class?.name} ${journal.journalDate}`"
                  @click="students = { visible: true, journal }"
                />
                <Button
                  v-if="journal.editable && can.update"
                  v-tooltip.top="'Ubah'"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  :aria-label="`Ubah jurnal ${journal.journalDate}`"
                  @click="openForm(journal)"
                />
                <Button
                  v-if="journal.editable && can.delete"
                  v-tooltip.top="'Hapus'"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :aria-label="`Hapus jurnal ${journal.journalDate}`"
                  @click="remove(journal)"
                />
              </template>
            </JournalTable>
          </div>
        </template>
      </Card>
    </template>

    <JournalFormDialog
      v-model:visible="form.visible"
      :journal="form.journal"
      :initial="form.initial"
      :today="today"
      :semester="semester.current.value"
      :class-options="options.classOptions.value"
      :subject-options="options.subjectOptions.value"
      :max-period="MAX_PERIOD"
      :submit="save"
    />
    <JournalStudentsDialog v-model:visible="students.visible" :journal="students.journal" />
    <ExportDialog
      v-model:visible="exportVisible"
      :semester="semester.current.value"
      :download="(params) => exportMyJournals({ ...params, ...scope() })"
    />
  </div>
</template>
