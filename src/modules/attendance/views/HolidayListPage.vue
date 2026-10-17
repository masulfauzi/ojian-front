<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatDate } from '@/shared/utils/format'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { createHoliday, deleteHoliday, listHolidays, updateHoliday } from '../api/holiday.api'
import HolidayFormDialog from '../components/HolidayFormDialog.vue'

const PAGE_SIZE = 25

const auth = useAuthStore()
const can = useCan('school_holidays')
const notify = useNotify()
const { confirmDelete } = useConfirm()

const thisYear = new Date().getFullYear()
const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  year: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const year = computed(() => Number(query.value.year) || thisYear)
// Membuat hari libur hanya oleh pengguna sekolah.
const canCreate = computed(() => can.value.create && !auth.isPlatformUser)

const list = usePagedList((params) => listHolidays(params))
async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: PAGE_SIZE,
      from: `${year.value}-01-01`,
      to: `${year.value}-12-31`,
    })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const setYear = (value) => update({ year: value === thisYear ? '' : String(value), page: 1 })

const formVisible = ref(false)
const editing = ref(null)
function openCreate() {
  editing.value = null
  formVisible.value = true
}
function openEdit(holiday) {
  editing.value = holiday
  formVisible.value = true
}
async function save(values) {
  if (editing.value) {
    await updateHoliday(editing.value.id, values, scope())
    notify.success('Hari libur diperbarui')
  } else {
    await createHoliday(values)
    notify.success(`Hari libur ${values.name} ditambahkan`)
  }
  await list.reload()
}
async function remove(holiday) {
  if (!(await confirmDelete(`hari libur ${holiday.name}`))) return
  try {
    await deleteHoliday(holiday.id, scope())
    notify.success('Hari libur dihapus')
    await list.reloadAfterDelete()
  } catch (error) {
    notify.error(error)
  }
}

const range = (h) =>
  h.startDate === h.endDate
    ? formatDate(h.startDate)
    : `${formatDate(h.startDate)} – ${formatDate(h.endDate)}`
</script>

<template>
  <div class="page">
    <PageHeader
      title="Hari Libur"
      description="Tanggal tanpa presensi di luar akhir pekan (libur nasional, libur semester)"
    >
      <template v-if="school.ready.value && canCreate" #actions>
        <Button label="Tambah hari libur" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <Card v-if="school.ready.value">
      <template #content>
        <div class="form-stack">
          <div class="month-switch">
            <Button
              icon="pi pi-angle-left"
              severity="secondary"
              text
              rounded
              aria-label="Tahun sebelumnya"
              @click="setYear(year - 1)"
            />
            <strong>{{ year }}</strong>
            <Button
              icon="pi pi-angle-right"
              severity="secondary"
              text
              rounded
              aria-label="Tahun berikutnya"
              @click="setYear(year + 1)"
            />
          </div>
          <DataTable
            :value="list.items.value"
            :loading="list.loading.value"
            :total-records="list.meta.value.total"
            :rows="PAGE_SIZE"
            :first="(query.page - 1) * PAGE_SIZE"
            data-key="id"
            lazy
            paginator
            :always-show-paginator="false"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState icon="pi pi-calendar-times" :title="`Belum ada hari libur di ${year}`" />
            </template>
            <Column field="name" header="Nama" />
            <Column header="Tanggal">
              <template #body="{ data }">{{ range(data) }}</template>
            </Column>
            <Column header="Lama">
              <template #body="{ data }">{{ data.days }} hari</template>
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

    <HolidayFormDialog v-model:visible="formVisible" :holiday="editing" :submit="save" />
  </div>
</template>
