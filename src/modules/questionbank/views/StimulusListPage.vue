<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { formatDateTime } from '@/shared/utils/format'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { createStimulus, deleteStimulus, listStimuli, updateStimulus } from '../api/stimulus.api'
import QuestionHtml from '../components/QuestionHtml.vue'
import StimulusFormDialog from '../components/StimulusFormDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const can = useCan('question_bank')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const canCreate = computed(() => can.value.create && !auth.isPlatformUser)

const list = usePagedList((params) => listStimuli(params))
async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const formVisible = ref(false)
const editing = ref(null)
const viewing = ref(null)

function open(stimulus = null) {
  editing.value = stimulus
  formVisible.value = true
}

async function save(values) {
  if (editing.value) {
    await updateStimulus(editing.value.id, values, scope())
    notify.success('Teks bacaan berhasil diperbarui')
  } else {
    await createStimulus(values)
    notify.success('Teks bacaan berhasil ditambahkan')
  }
  await list.reload()
}

async function remove(stimulus) {
  if (!(await confirmDelete(`teks bacaan "${stimulus.title}"`))) return
  try {
    await deleteStimulus(stimulus.id, scope())
    notify.success('Teks bacaan berhasil dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Teks Bacaan"
      description="Bacaan yang dipakai bersama beberapa soal (gaya AKM)"
    >
      <template #actions>
        <Button
          label="Bank soal"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({ name: 'question-bank' })"
        />
        <Button
          v-if="canCreate && school.ready.value"
          label="Tambah teks bacaan"
          icon="pi pi-plus"
          @click="open()"
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
                placeholder="Cari judul"
                aria-label="Cari teks bacaan"
                fluid
              />
            </IconField>
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
            current-page-report-template="{first}–{last} dari {totalRecords} teks bacaan"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState icon="pi pi-book" title="Belum ada teks bacaan" />
            </template>
            <Column header="Judul">
              <template #body="{ data }">
                <a href="#" class="link-strong" @click.prevent="viewing = data">{{ data.title }}</a>
              </template>
            </Column>
            <Column header="Diperbarui">
              <template #body="{ data }"
                ><span class="text-muted">{{ formatDateTime(data.updatedAt) }}</span></template
              >
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
                    aria-label="Lihat"
                    @click="viewing = data"
                  />
                  <Button
                    v-if="can.update && !auth.isPlatformUser"
                    v-tooltip.top="'Ubah'"
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    aria-label="Ubah"
                    @click="open(data)"
                  />
                  <Button
                    v-if="can.delete && !auth.isPlatformUser"
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

    <StimulusFormDialog v-model:visible="formVisible" :stimulus="editing" :submit="save" />
    <Dialog
      :visible="Boolean(viewing)"
      :header="viewing?.title"
      :style="{ width: 'min(48rem, calc(100vw - 2rem))' }"
      modal
      @update:visible="(v) => !v && (viewing = null)"
    >
      <QuestionHtml v-if="viewing" :html="viewing.body" :school-id="school.scopeId.value" />
    </Dialog>
  </div>
</template>
