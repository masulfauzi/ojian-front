<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { monthKey, monthLabel, shiftMonth } from '@/shared/utils/date'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { useTeacherOptions } from '@/modules/classroom'
import { exportJournals, listJournals } from '../api/journal.api'
import ExportDialog from '../components/ExportDialog.vue'
import JournalStudentsDialog from '../components/JournalStudentsDialog.vue'
import JournalTable from '../components/JournalTable.vue'
import SemesterSwitcher from '../components/SemesterSwitcher.vue'
import { useTeachingOptions } from '../composables/useTeachingOptions'
import { useWorkingSemester } from '../composables/useWorkingSemester'

const PAGE_SIZE = 50

const notify = useNotify()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  semester: { type: 'string' },
  page: { type: 'page' },
  teacher_id: { type: 'string' },
  class_id: { type: 'string' },
  subject_id: { type: 'string' },
  month: { type: 'string' },
  search: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const semester = useWorkingSemester({ query, update, school })
const options = useTeachingOptions(school, semester)
const teachers = useTeacherOptions(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value, semesterId: semester.id.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

/** Bulan di dalam semester untuk filter. */
function semesterMonths() {
  const s = semester.current.value
  if (!s?.startDate || !s?.endDate) return []
  const out = []
  for (
    let m = s.startDate.slice(0, 7);
    m <= s.endDate.slice(0, 7) && out.length < 12;
    m = shiftMonth(m, 1)
  ) {
    if (m > monthKey()) break
    out.push({ value: m, label: monthLabel(m) })
  }
  return out
}

const list = usePagedList((params) => listJournals(params))
async function load() {
  if (!semester.id.value) return
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: PAGE_SIZE,
      teacherId: query.value.teacher_id || undefined,
      classId: query.value.class_id || undefined,
      subjectId: query.value.subject_id || undefined,
      month: query.value.month || undefined,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })
watch(
  () => semester.id.value,
  () => isActiveRoute() && load(),
)

const students = ref({ visible: false, journal: null })
const exportVisible = ref(false)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Rekap Jurnal"
      description="Jurnal mengajar semua guru per semester, siap diunduh sebagai Excel"
    >
      <template v-if="school.ready.value" #actions>
        <Button
          label="Unduh Excel"
          icon="pi pi-file-excel"
          :disabled="!semester.id.value"
          @click="exportVisible = true"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <SemesterSwitcher :semester="semester" />
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
                :model-value="query.teacher_id || null"
                :options="teachers.teachers.value"
                option-label="label"
                option-value="value"
                placeholder="Semua guru"
                aria-label="Filter guru"
                :loading="teachers.loading.value"
                show-clear
                filter
                @update:model-value="(v) => update({ teacher_id: v ?? '', page: 1 })"
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
              <Select
                class="toolbar__filter"
                :model-value="query.month || null"
                :options="semesterMonths()"
                option-label="label"
                option-value="value"
                placeholder="Semua bulan"
                aria-label="Filter bulan"
                show-clear
                @update:model-value="(v) => update({ month: v ?? '', page: 1 })"
              />
            </div>
            <EmptyState
              v-if="!semester.id.value && !semester.calendar.loading.value"
              icon="pi pi-calendar"
              title="Belum ada semester aktif"
            />
            <JournalTable
              v-else
              :items="list.items.value"
              :loading="list.loading.value"
              :total="list.meta.value.total"
              :rows="PAGE_SIZE"
              :first="(query.page - 1) * PAGE_SIZE"
              show-teacher
              empty-title="Belum ada jurnal pada semester ini"
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
              </template>
            </JournalTable>
          </div>
        </template>
      </Card>
    </template>

    <JournalStudentsDialog
      v-model:visible="students.visible"
      :journal="students.journal"
      :school-id="school.scopeId.value"
    />
    <ExportDialog
      v-model:visible="exportVisible"
      :semester="semester.current.value"
      :teacher-options="teachers.teachers.value"
      :download="(params) => exportJournals({ ...params, ...scope() })"
    />
  </div>
</template>
