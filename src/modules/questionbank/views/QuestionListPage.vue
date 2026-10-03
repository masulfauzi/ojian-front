<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { listSubjectOptions } from '@/modules/subject'
import {
  QUESTION_STATUSES,
  copyQuestion,
  deleteQuestion,
  listQuestions,
  listQuestionTypes,
  statusOf,
} from '../api/question.api'
import { difficultyOf, visibilityOf } from '../constants'
import { typeOf } from '../types/definitions'

const router = useRouter()
const auth = useAuthStore()
const can = useCan('question_bank')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  subject: { type: 'string' },
  type: { type: 'string' },
  status: { type: 'string', options: ['draft', 'active', 'archived'] },
  tags: { type: 'string' },
  mine: { type: 'boolean' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const tagsInput = useSearchInput(
  () => query.value.tags,
  (tags) => update({ tags, page: 1 }),
)
// Membuat soal hanya untuk pengguna sekolah (bukan super admin).
const canCreate = computed(() => can.value.create && !auth.isPlatformUser)

const types = ref([])
const subjects = ref([])
onMounted(async () => {
  try {
    types.value = await listQuestionTypes()
  } catch {
    types.value = []
  }
})
watch(
  () => [school.scopeId.value, school.ready.value],
  async ([, ready]) => {
    if (!ready) return
    try {
      subjects.value = await listSubjectOptions(scope())
    } catch {
      subjects.value = []
    }
  },
  { immediate: true },
)

const list = usePagedList((params) => listQuestions(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      subjectId: query.value.subject,
      typeCode: query.value.type,
      status: query.value.status,
      tags: query.value.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      mine: query.value.mine === true,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const detail = (q) =>
  router.push({
    name: 'question-detail',
    params: { id: q.id },
    query: { school_id: school.scopeId.value || undefined },
  })
const edit = (q) => router.push({ name: 'question-edit', params: { id: q.id } })

async function copy(q) {
  try {
    const copied = await copyQuestion(q.id, scope())
    notify.success('Soal disalin ke bank soal Anda sebagai draf pribadi')
    router.push({ name: 'question-detail', params: { id: copied.id } })
  } catch (error) {
    notify.error(error)
  }
}

async function remove(q) {
  if (!(await confirmDelete('soal ini'))) return
  try {
    await deleteQuestion(q.id, scope())
    notify.success('Soal berhasil dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Bank Soal"
      description="Soal milik Anda dan soal yang dibagikan guru lain di sekolah"
    >
      <template v-if="school.ready.value" #actions>
        <Button
          label="Teks bacaan"
          icon="pi pi-book"
          severity="secondary"
          outlined
          @click="
            router.push({
              name: 'stimuli',
              query: { school_id: school.scopeId.value || undefined },
            })
          "
        />
        <Button
          v-if="canCreate"
          label="Tambah soal"
          icon="pi pi-plus"
          @click="router.push({ name: 'question-new' })"
        />
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
                placeholder="Cari teks soal"
                aria-label="Cari soal"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="query.subject || null"
              :options="subjects"
              option-label="name"
              option-value="id"
              placeholder="Semua mapel"
              aria-label="Filter mata pelajaran"
              filter
              show-clear
              @update:model-value="(v) => update({ subject: v ?? '', page: 1 })"
            />
            <Select
              class="toolbar__filter"
              :model-value="query.type || null"
              :options="types"
              option-label="name"
              option-value="code"
              placeholder="Semua jenis"
              aria-label="Filter jenis soal"
              show-clear
              @update:model-value="(v) => update({ type: v ?? '', page: 1 })"
            />
            <Select
              class="toolbar__filter toolbar__filter--narrow"
              :model-value="query.status || null"
              :options="QUESTION_STATUSES"
              option-label="label"
              option-value="value"
              placeholder="Status"
              aria-label="Filter status"
              show-clear
              @update:model-value="(v) => update({ status: v ?? '', page: 1 })"
            />
            <InputText
              v-model="tagsInput"
              class="toolbar__filter"
              placeholder="Tag (pisah koma)"
              aria-label="Filter tag"
            />
            <label class="form-switch">
              <Checkbox
                :model-value="query.mine === true"
                binary
                @update:model-value="(v) => update({ mine: v || null, page: 1 })"
              />
              Soal saya
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
            current-page-report-template="{first}–{last} dari {totalRecords} soal"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState
                icon="pi pi-database"
                title="Belum ada soal"
                description="Tidak ada soal yang cocok dengan filter."
              />
            </template>
            <Column header="Soal">
              <template #body="{ data }">
                <div class="cell-stack question-cell">
                  <a href="#" class="link-strong question-cell__text" @click.prevent="detail(data)">
                    {{ data.preview || '(tanpa teks)' }}
                  </a>
                  <span class="text-muted">
                    <template v-if="data.topic">{{ data.topic }} · </template>
                    <span v-for="tag in data.tags" :key="tag" class="question-tag">#{{ tag }}</span>
                  </span>
                </div>
              </template>
            </Column>
            <Column header="Jenis">
              <template #body="{ data }">
                <span class="question-type">
                  <i :class="typeOf(data.typeCode)?.icon ?? 'pi pi-question'" aria-hidden="true" />
                  {{ typeOf(data.typeCode)?.label ?? data.typeCode }}
                </span>
              </template>
            </Column>
            <Column header="Mapel">
              <template #body="{ data }">
                {{ data.subjectName ?? '-'
                }}<span v-if="data.gradeLevel" class="text-muted"> · {{ data.gradeLevel }}</span>
              </template>
            </Column>
            <Column header="Kesulitan">
              <template #body="{ data }">
                <Tag
                  v-if="difficultyOf(data.difficulty)"
                  :value="difficultyOf(data.difficulty).label"
                  :severity="difficultyOf(data.difficulty).severity"
                />
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag
                  :value="statusOf(data.status).label"
                  :severity="statusOf(data.status).severity"
                />
                <span class="text-muted"> v{{ data.versionNo }}</span>
              </template>
            </Column>
            <Column header="Pembuat">
              <template #body="{ data }">
                <span class="question-owner">
                  <i
                    v-tooltip.top="visibilityOf(data.visibility)?.hint"
                    :class="visibilityOf(data.visibility)?.icon"
                    aria-hidden="true"
                  />
                  {{ data.creatorName ?? '-' }}
                </span>
              </template>
            </Column>
            <Column header="Aksi">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button
                    v-tooltip.top="'Lihat & pratinjau'"
                    icon="pi pi-eye"
                    severity="secondary"
                    text
                    rounded
                    aria-label="Lihat"
                    @click="detail(data)"
                  />
                  <Button
                    v-if="data.canEdit && can.update"
                    v-tooltip.top="'Ubah'"
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    aria-label="Ubah"
                    @click="edit(data)"
                  />
                  <Button
                    v-if="canCreate"
                    v-tooltip.top="'Salin ke bank saya'"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    aria-label="Salin"
                    @click="copy(data)"
                  />
                  <Button
                    v-if="data.canEdit && can.delete"
                    v-tooltip.top="'Hapus'"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    aria-label="Hapus"
                    @click="remove(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>
