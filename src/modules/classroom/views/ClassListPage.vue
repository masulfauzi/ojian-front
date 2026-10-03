<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import {
  copyClasses,
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from '../api/classroom.api'
import ClassFormDialog from '../components/ClassFormDialog.vue'
import CopyClassesDialog from '../components/CopyClassesDialog.vue'
import { useTeacherOptions } from '../composables/useTeacherOptions'

const router = useRouter()
const can = useCan('classes')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  year: { type: 'string' },
  semester: { type: 'string' },
  grade: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const teachers = useTeacherOptions(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

// Tahun default: tahun semester aktif, atau tahun terbaru.
const yearId = computed(
  () =>
    (calendar.yearOf(query.value.year) && query.value.year) ||
    calendar.activeSemester.value?.academicYearId ||
    calendar.years.value[0]?.id ||
    null,
)
const year = computed(() => calendar.yearOf(yearId.value))
const yearSemesters = computed(() => calendar.semestersOfYear(yearId.value))
// Semester untuk jumlah siswa: pilihan pengguna, semester aktif bila di tahun ini, atau Ganjil.
const semesterId = computed(() => {
  const ids = yearSemesters.value.map((s) => s.id)
  if (ids.includes(query.value.semester)) return query.value.semester
  const active = calendar.activeSemester.value
  return active && ids.includes(active.id) ? active.id : (yearSemesters.value.at(-1)?.id ?? null)
})

const yearOptions = computed(() =>
  calendar.years.value.map((y) => ({ value: y.id, label: y.name })),
)
const semesterOptions = computed(() =>
  yearSemesters.value.map((s) => ({
    value: s.id,
    label: s.termName + (s.isActive ? ' (aktif)' : ''),
  })),
)

const list = usePagedList((params) => listClasses(params))

async function load() {
  if (!yearId.value) {
    list.items.value = []
    return
  }
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      academicYearId: yearId.value,
      semesterId: semesterId.value,
      gradeLevel: Number(query.value.grade) || undefined,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch([query, yearId, semesterId], () => isActiveRoute() && school.ready.value && load(), {
  immediate: true,
})

// ---- Tambah / ubah / hapus ----
const formVisible = ref(false)
const editing = ref(null)

function openCreate() {
  editing.value = null
  formVisible.value = true
}

function openEdit(classroom) {
  editing.value = classroom
  formVisible.value = true
}

async function saveClass(values) {
  if (editing.value) {
    await updateClass(editing.value.id, values, scope())
    notify.success('Kelas berhasil diperbarui')
  } else {
    await createClass(values, scope())
    notify.success(`Kelas ${values.name} berhasil ditambahkan`)
    if (values.academicYearId !== yearId.value) update({ year: values.academicYearId, page: 1 })
  }
  await load()
}

async function removeClass(classroom) {
  if (!(await confirmDelete(`kelas ${classroom.name}`))) return
  try {
    await deleteClass(classroom.id, scope())
    notify.success('Kelas berhasil dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}

// ---- Salin kelas ----
const copyVisible = ref(false)

async function runCopy(values) {
  const { copied } = await copyClasses(values, scope())
  notify.success(`${copied} kelas disalin ke ${year.value?.name}`)
  await load()
}

const openDetail = (classroom) =>
  router.push({
    name: 'class-detail',
    params: { id: classroom.id },
    query: { semester: semesterId.value, school_id: school.scopeId.value || undefined },
  })
</script>

<template>
  <div class="page">
    <PageHeader title="Kelas" description="Rombongan belajar per tahun pelajaran">
      <template v-if="school.ready.value && calendar.years.value.length" #actions>
        <Button
          v-if="can.update"
          label="Kenaikan kelas"
          icon="pi pi-angle-double-up"
          severity="secondary"
          outlined
          @click="
            router.push({
              name: 'promotions',
              query: { school_id: school.scopeId.value || undefined },
            })
          "
        />
        <Button
          v-if="can.create"
          label="Salin dari tahun lain"
          icon="pi pi-copy"
          severity="secondary"
          outlined
          :disabled="calendar.years.value.length < 2"
          @click="copyVisible = true"
        />
        <Button v-if="can.create" label="Tambah kelas" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <Message
        v-if="!calendar.loading.value && !calendar.years.value.length"
        severity="warn"
        :closable="false"
      >
        Belum ada tahun pelajaran. Buat tahun pelajaran lebih dulu di menu
        <RouterLink :to="{ name: 'academic-years' }">Tahun Pelajaran & Semester</RouterLink>.
      </Message>

      <Card v-else>
        <template #content>
          <div class="form-stack">
            <div class="toolbar">
              <Select
                class="toolbar__filter"
                :model-value="yearId"
                :options="yearOptions"
                option-label="label"
                option-value="value"
                aria-label="Tahun pelajaran"
                @update:model-value="(value) => update({ year: value, semester: '', page: 1 })"
              />
              <Select
                class="toolbar__filter"
                :model-value="semesterId"
                :options="semesterOptions"
                option-label="label"
                option-value="value"
                aria-label="Semester (untuk jumlah siswa)"
                @update:model-value="(value) => update({ semester: value })"
              />
              <InputNumber
                class="toolbar__filter toolbar__filter--narrow"
                :model-value="Number(query.grade) || null"
                :min="1"
                :max="13"
                placeholder="Tingkat"
                aria-label="Filter tingkat"
                :use-grouping="false"
                @update:model-value="
                  (value) => update({ grade: value ? String(value) : '', page: 1 })
                "
              />
              <IconField class="toolbar__search">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchInput"
                  placeholder="Cari nama kelas"
                  aria-label="Cari kelas"
                  fluid
                />
              </IconField>
            </div>

            <DataTable
              :value="list.items.value"
              :loading="list.loading.value || calendar.loading.value"
              :total-records="list.meta.value.total"
              :rows="DEFAULT_PAGE_SIZE"
              :first="(query.page - 1) * DEFAULT_PAGE_SIZE"
              data-key="id"
              lazy
              paginator
              paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              current-page-report-template="{first}–{last} dari {totalRecords} kelas"
              striped-rows
              @page="(event) => update({ page: event.page + 1 })"
            >
              <template #empty>
                <EmptyState
                  icon="pi pi-sitemap"
                  title="Belum ada kelas"
                  :description="`Belum ada kelas di ${year?.name ?? 'tahun ini'}. Tambah kelas atau salin dari tahun lain.`"
                />
              </template>
              <Column header="Kelas">
                <template #body="{ data }">
                  <a href="#" class="link-strong" @click.prevent="openDetail(data)">{{
                    data.name
                  }}</a>
                </template>
              </Column>
              <Column header="Tingkat" field="gradeLevel" />
              <Column header="Wali kelas">
                <template #body="{ data }">
                  <span :class="{ 'text-muted': !data.homeroomName }">{{
                    data.homeroomName || 'Belum ada'
                  }}</span>
                </template>
              </Column>
              <Column header="Siswa">
                <template #body="{ data }">{{ data.studentCount }}</template>
              </Column>
              <Column header="Aksi">
                <template #body="{ data }">
                  <div class="row-actions">
                    <Button
                      v-tooltip.top="'Anggota kelas'"
                      icon="pi pi-users"
                      severity="secondary"
                      text
                      rounded
                      :aria-label="`Anggota ${data.name}`"
                      @click="openDetail(data)"
                    />
                    <Button
                      v-if="can.update"
                      v-tooltip.top="'Ubah'"
                      icon="pi pi-pencil"
                      severity="secondary"
                      text
                      rounded
                      :aria-label="`Ubah ${data.name}`"
                      @click="openEdit(data)"
                    />
                    <Button
                      v-if="can.delete"
                      v-tooltip.top="'Hapus'"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      :aria-label="`Hapus ${data.name}`"
                      @click="removeClass(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>
    </template>

    <ClassFormDialog
      v-model:visible="formVisible"
      :classroom="editing"
      :year-options="yearOptions"
      :default-year-id="yearId"
      :teacher-options="teachers.teachers.value"
      :teachers-available="teachers.available.value"
      :submit="saveClass"
    />
    <CopyClassesDialog
      v-model:visible="copyVisible"
      :target-year="year"
      :years="calendar.years.value"
      :submit="runCopy"
    />
  </div>
</template>
