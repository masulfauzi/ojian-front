<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusTag from '@/shared/components/StatusTag.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { ACTIVE_STATUS_OPTIONS } from '@/shared/constants/status'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { createSubject, deleteSubject, listSubjects, updateSubject } from '../api/subject.api'
import SubjectFormDialog from '../components/SubjectFormDialog.vue'

const can = useCan('subjects')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  is_active: { type: 'boolean' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)

const list = usePagedList((params) => listSubjects(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      isActive: query.value.is_active,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const formVisible = ref(false)
const editing = ref(null)

function openCreate() {
  editing.value = null
  formVisible.value = true
}

function openEdit(subject) {
  editing.value = subject
  formVisible.value = true
}

async function save(values) {
  if (editing.value) {
    await updateSubject(editing.value.id, values, scope())
    notify.success('Mata pelajaran berhasil diperbarui')
  } else {
    await createSubject(values, scope())
    notify.success(`Mata pelajaran ${values.name} berhasil ditambahkan`)
  }
  await list.reload()
}

async function remove(subject) {
  if (!(await confirmDelete(`mata pelajaran ${subject.name}`))) return
  try {
    await deleteSubject(subject.id, scope())
    notify.success('Mata pelajaran berhasil dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    // 409: sudah dipakai soal — sarankan menonaktifkan.
    notify.error(
      error.status === 409 ? `${error.message}. Nonaktifkan saja lewat tombol ubah.` : error,
    )
  }
}
</script>

<template>
  <div class="page">
    <PageHeader title="Mata Pelajaran" description="Mata pelajaran untuk mengelompokkan bank soal">
      <template v-if="school.ready.value" #actions>
        <Button
          v-if="can.create"
          label="Tambah mata pelajaran"
          icon="pi pi-plus"
          @click="openCreate"
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
                placeholder="Cari kode atau nama"
                aria-label="Cari mata pelajaran"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="query.is_active"
              :options="ACTIVE_STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Semua status"
              aria-label="Filter status"
              show-clear
              @update:model-value="(value) => update({ is_active: value ?? null, page: 1 })"
            />
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
            current-page-report-template="{first}–{last} dari {totalRecords} mata pelajaran"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState icon="pi pi-bookmark" title="Belum ada mata pelajaran" />
            </template>
            <Column header="Kode">
              <template #body="{ data }"
                ><code>{{ data.code }}</code></template
              >
            </Column>
            <Column field="name" header="Nama" />
            <Column header="Status">
              <template #body="{ data }"><StatusTag :active="data.isActive" /></template>
            </Column>
            <Column v-if="can.update || can.delete" header="Aksi">
              <template #body="{ data }">
                <div class="row-actions">
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
                    @click="remove(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <SubjectFormDialog v-model:visible="formVisible" :subject="editing" :submit="save" />
  </div>
</template>
