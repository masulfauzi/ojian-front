<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { formatDateTime } from '@/shared/utils/format'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { listSubjectOptions } from '@/modules/subject'
import {
  EXAM_STATUSES,
  archiveExam,
  createExam,
  deleteExam,
  duplicateExam,
  examStatusOf,
  listExams,
} from '../api/exam.api'
import ExamFormDialog from '../components/ExamFormDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const can = useCan('exams')
const notify = useNotify()
const { ask, confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  subject: { type: 'string' },
  status: { type: 'string', options: ['draft', 'published', 'archived'] },
  mine: { type: 'boolean' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
// Paket hanya bisa dibuat pengguna sekolah (bukan super admin).
const canCreate = computed(() => can.value.create && !auth.isPlatformUser)

const subjects = ref([])
watch(
  () => [school.scopeId.value, school.ready.value],
  async ([, ready]) => {
    if (!ready) return
    subjects.value = await listSubjectOptions(scope()).catch(() => [])
  },
  { immediate: true },
)
const subjectFilter = computed(() => subjects.value.map((s) => ({ value: s.id, label: s.name })))

const list = usePagedList((params) => listExams(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      subjectId: query.value.subject || undefined,
      status: query.value.status || undefined,
      mine: query.value.mine === true,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const open = (exam) =>
  router.push({
    name: 'exam-detail',
    params: { id: exam.id },
    query: school.scopeId.value ? { school_id: school.scopeId.value } : {},
  })

const formVisible = ref(false)
async function create(values) {
  const exam = await createExam(values, scope())
  notify.success('Paket ujian dibuat. Tambahkan soal dari bank soal.')
  open(exam)
}

async function duplicate(exam) {
  try {
    const copy = await duplicateExam(exam.id, scope())
    notify.success(`Paket disalin sebagai draf: ${copy.title}`)
    open(copy)
  } catch (error) {
    notify.error(error)
  }
}

async function archive(exam) {
  const ok = await ask({
    header: 'Arsipkan paket',
    message: `Paket "${exam.title}" tidak bisa dipilih lagi untuk jadwal baru. Jadwal yang sudah ada tidak terpengaruh. Lanjutkan?`,
    acceptLabel: 'Arsipkan',
  })
  if (!ok) return
  try {
    list.replaceItem(await archiveExam(exam.id, scope()))
    notify.success('Paket diarsipkan')
  } catch (error) {
    notify.error(error)
  }
}

async function remove(exam) {
  if (!(await confirmDelete(`paket ${exam.title}`))) return
  try {
    await deleteExam(exam.id, scope())
    notify.success('Paket ujian dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Paket Ujian"
      description="Kumpulan soal dari bank soal yang siap dijadwalkan"
    >
      <template v-if="school.ready.value && canCreate" #actions>
        <Button label="Buat paket" icon="pi pi-plus" @click="formVisible = true" />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <Card v-if="school.ready.value">
      <template #content>
        <div class="form-stack">
          <div class="toolbar">
            <IconField class="toolbar__search">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchInput"
                placeholder="Cari judul paket"
                aria-label="Cari paket ujian"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="query.subject || null"
              :options="subjectFilter"
              option-label="label"
              option-value="value"
              placeholder="Semua mapel"
              aria-label="Filter mata pelajaran"
              show-clear
              @update:model-value="(value) => update({ subject: value ?? '', page: 1 })"
            />
            <Select
              class="toolbar__filter"
              :model-value="query.status || null"
              :options="EXAM_STATUSES"
              option-label="label"
              option-value="value"
              placeholder="Semua status"
              aria-label="Filter status"
              show-clear
              @update:model-value="(value) => update({ status: value ?? '', page: 1 })"
            />
            <label class="form-switch">
              <Checkbox
                :model-value="query.mine === true"
                binary
                @update:model-value="(value) => update({ mine: value ? true : null, page: 1 })"
              />
              Paket saya
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
            current-page-report-template="{first}–{last} dari {totalRecords} paket"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState
                icon="pi pi-clipboard"
                title="Belum ada paket ujian"
                description="Buat paket, pilih soal aktif dari bank soal, lalu publikasikan agar bisa dijadwalkan."
              />
            </template>
            <Column header="Paket">
              <template #body="{ data }">
                <a class="link-strong" href="#" @click.prevent="open(data)">{{ data.title }}</a>
                <div class="text-muted">{{ data.creatorName }}</div>
              </template>
            </Column>
            <Column header="Mapel">
              <template #body="{ data }">
                {{ data.subjectName ?? '-' }}
                <span v-if="data.gradeLevel" class="text-muted">
                  · Kelas {{ data.gradeLevel }}</span
                >
              </template>
            </Column>
            <Column header="Soal">
              <template #body="{ data }">
                {{ data.questionCount }} soal
                <div class="text-muted">{{ data.totalPoints }} poin</div>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag
                  :value="examStatusOf(data.status).label"
                  :severity="examStatusOf(data.status).severity"
                />
              </template>
            </Column>
            <Column header="Diperbarui">
              <template #body="{ data }">
                <span class="text-muted">{{ formatDateTime(data.updatedAt) }}</span>
              </template>
            </Column>
            <Column header="Aksi">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button
                    v-tooltip.top="'Lihat'"
                    icon="pi pi-eye"
                    severity="secondary"
                    text
                    rounded
                    :aria-label="`Lihat ${data.title}`"
                    @click="open(data)"
                  />
                  <Button
                    v-if="canCreate"
                    v-tooltip.top="'Duplikat'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    :aria-label="`Duplikat ${data.title}`"
                    @click="duplicate(data)"
                  />
                  <Button
                    v-if="data.status === 'published' && data.canEdit && can.update"
                    v-tooltip.top="'Arsipkan'"
                    icon="pi pi-inbox"
                    severity="secondary"
                    text
                    rounded
                    :aria-label="`Arsipkan ${data.title}`"
                    @click="archive(data)"
                  />
                  <Button
                    v-if="data.status === 'draft' && data.canEdit && can.delete"
                    v-tooltip.top="'Hapus'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :aria-label="`Hapus ${data.title}`"
                    @click="remove(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <ExamFormDialog v-model:visible="formVisible" :subjects="subjects" :submit="create" />
  </div>
</template>
