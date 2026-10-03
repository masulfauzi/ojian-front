<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import { listClassOptions } from '@/modules/classroom'
import {
  createStudent,
  deleteStudent,
  downloadImportTemplate,
  getClassHistory,
  getStudent,
  importStudents,
  listStudents,
  updateStudent,
} from '../api/student.api'
import InitialPasswordDialog from '../components/InitialPasswordDialog.vue'
import StudentDetailDrawer from '../components/StudentDetailDrawer.vue'
import StudentFormDialog from '../components/StudentFormDialog.vue'
import StudentImportDialog from '../components/StudentImportDialog.vue'
import { STUDENT_STATUSES, STUDENT_STATUS_VALUES, statusOf } from '../constants'

const can = useCan('students')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  status: { type: 'string', options: STUDENT_STATUS_VALUES },
  class: { type: 'string' },
  unassigned: { type: 'boolean' },
})
const school = useSchoolContext({ query, update })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

// Kolom kelas dan filter memakai semester aktif.
const activeSemester = computed(() => calendar.activeSemester.value)
const classes = ref([])
watch(
  () => [activeSemester.value?.academicYearId, school.scopeId.value],
  async ([yearId]) => {
    try {
      classes.value = yearId ? await listClassOptions({ ...scope(), academicYearId: yearId }) : []
    } catch {
      classes.value = []
    }
  },
  { immediate: true },
)
const classOptions = computed(() => classes.value.map((c) => ({ value: c.id, label: c.name })))

const list = usePagedList((params) => listStudents(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      status: query.value.status,
      classId: query.value.unassigned ? '' : query.value.class,
      unassigned: query.value.unassigned === true,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

// ---- Tambah / ubah / hapus ----
const formVisible = ref(false)
const editing = ref(null)
const createdAccount = ref(null)
const passwordVisible = ref(false)

function openCreate() {
  editing.value = null
  formVisible.value = true
}

function openEdit(student) {
  editing.value = student
  formVisible.value = true
}

async function saveStudent(values) {
  if (editing.value) {
    await updateStudent(editing.value.id, values, scope())
    notify.success('Data siswa berhasil diperbarui')
    await list.reload()
    return
  }
  const { student, initialPassword } = await createStudent(values, scope())
  await list.reload()
  if (initialPassword) {
    createdAccount.value = {
      name: student.name,
      username: student.username,
      password: initialPassword,
    }
    passwordVisible.value = true
  } else {
    notify.success(`${student.name} berhasil ditambahkan. Username: ${student.username}`)
  }
}

async function removeStudent(student) {
  if (!(await confirmDelete(`siswa ${student.name} beserta akunnya`))) return
  try {
    await deleteStudent(student.id, scope())
    notify.success('Siswa berhasil dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}

// ---- Impor ----
const importVisible = ref(false)
const uploadFile = (file) => importStudents(file, scope())
function onImported(report) {
  notify.success(`${report.created} dari ${report.total} siswa berhasil diimpor`)
  list.reload()
}

// ---- Detail ----
const detailVisible = ref(false)
const detailId = ref(null)
const loadDetail = async (id) => {
  const [student, history] = await Promise.all([
    getStudent(id, scope()),
    getClassHistory(id, scope()),
  ])
  return { student, history }
}
function openDetail(student) {
  detailId.value = student.id
  detailVisible.value = true
}
</script>

<template>
  <div class="page">
    <PageHeader title="Siswa" description="Data siswa dan akun login siswa">
      <template v-if="school.ready.value" #actions>
        <Button
          v-if="can.create"
          label="Impor Excel"
          icon="pi pi-file-excel"
          severity="secondary"
          outlined
          @click="importVisible = true"
        />
        <Button v-if="can.create" label="Tambah siswa" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <Message v-if="!calendar.loading.value && !activeSemester" severity="warn" :closable="false">
        Belum ada semester aktif, jadi kelas siswa belum dapat ditampilkan.
      </Message>

      <Card>
        <template #content>
          <div class="form-stack">
            <div class="toolbar">
              <IconField class="toolbar__search">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchInput"
                  placeholder="Cari nama, NIS, atau NISN"
                  aria-label="Cari siswa"
                  fluid
                />
              </IconField>
              <Select
                class="toolbar__filter"
                :model-value="query.status || null"
                :options="STUDENT_STATUSES"
                option-label="label"
                option-value="value"
                placeholder="Semua status"
                aria-label="Filter status"
                show-clear
                @update:model-value="(value) => update({ status: value ?? '', page: 1 })"
              />
              <Select
                class="toolbar__filter"
                :model-value="query.class || null"
                :options="classOptions"
                option-label="label"
                option-value="value"
                placeholder="Semua kelas"
                aria-label="Filter kelas"
                :disabled="query.unassigned === true || !classOptions.length"
                filter
                show-clear
                @update:model-value="(value) => update({ class: value ?? '', page: 1 })"
              />
              <label class="form-switch">
                <Checkbox
                  :model-value="query.unassigned === true"
                  binary
                  @update:model-value="
                    (value) => update({ unassigned: value || null, class: '', page: 1 })
                  "
                />
                Belum punya kelas
              </label>
            </div>

            <DataTable
              :value="list.items.value"
              :loading="list.loading.value"
              :total-records="list.meta.value.total"
              :rows="DEFAULT_PAGE_SIZE"
              :first="(query.page - 1) * DEFAULT_PAGE_SIZE"
              data-key="id"
              lazy
              paginator
              paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              current-page-report-template="{first}–{last} dari {totalRecords} siswa"
              striped-rows
              @page="(event) => update({ page: event.page + 1 })"
            >
              <template #empty>
                <EmptyState
                  icon="pi pi-id-card"
                  title="Belum ada siswa"
                  description="Tidak ada siswa yang cocok. Tambah siswa satu per satu atau impor dari Excel."
                />
              </template>
              <Column header="Siswa">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <a href="#" class="link-strong" @click.prevent="openDetail(data)">{{
                      data.name
                    }}</a>
                    <span class="text-muted">NISN {{ data.nisn || '-' }} · NIS {{ data.nis }}</span>
                  </div>
                </template>
              </Column>
              <Column header="Kelas">
                <template #body="{ data }">
                  <span :class="{ 'text-muted': !data.class }">{{
                    data.class?.name ?? 'Belum ada'
                  }}</span>
                </template>
              </Column>
              <Column header="L/P">
                <template #body="{ data }">{{ data.gender || '-' }}</template>
              </Column>
              <Column header="Status">
                <template #body="{ data }">
                  <div class="tag-list">
                    <Tag
                      :value="statusOf(data.status).label"
                      :severity="statusOf(data.status).severity"
                    />
                    <Tag
                      v-if="!data.accountActive && data.status === 'active'"
                      value="Akun nonaktif"
                      severity="secondary"
                    />
                  </div>
                </template>
              </Column>
              <Column header="Aksi">
                <template #body="{ data }">
                  <div class="row-actions">
                    <Button
                      v-tooltip.top="'Detail & riwayat kelas'"
                      icon="pi pi-eye"
                      severity="secondary"
                      text
                      rounded
                      :aria-label="`Detail ${data.name}`"
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
                      @click="removeStudent(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>
    </template>

    <StudentFormDialog
      v-model:visible="formVisible"
      :student="editing"
      :class-options="classOptions"
      :active-semester-label="activeSemester?.label?.replace(' (aktif)', '') ?? ''"
      :submit="saveStudent"
    />
    <InitialPasswordDialog v-model:visible="passwordVisible" :account="createdAccount" />
    <StudentImportDialog
      v-model:visible="importVisible"
      :load-template="downloadImportTemplate"
      :upload="uploadFile"
      @imported="onImported"
    />
    <StudentDetailDrawer
      v-model:visible="detailVisible"
      :student-id="detailId"
      :load="loadDetail"
    />
  </div>
</template>
