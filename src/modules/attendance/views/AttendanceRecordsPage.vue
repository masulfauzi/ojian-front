<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { fromISODate, toISODate } from '@/shared/utils/date'
import { formatDate } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import {
  correctRecord,
  deleteRecord,
  getSelfieUrl,
  listRecords,
  listUnassignedStudents,
} from '../api/attendance.api'
import CorrectionDialog from '../components/CorrectionDialog.vue'
import NoteDialog from '../components/NoteDialog.vue'
import { useClassOptions } from '../composables/useClassOptions'
import { RECORD_STATUS_FILTERS, SOURCE_LABELS, attendanceStatusOf } from '../constants'
import { wallTime } from '../utils/calendar'

const PAGE_SIZE = 25

const can = useCan('attendance_records')
const canClasses = useCan('classes')
const notify = useNotify()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  date: { type: 'string' },
  class_id: { type: 'string' },
  status: { type: 'string', options: ['present', 'late', 'excused', 'sick', 'absent', 'none'] },
  search: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const classes = useClassOptions(school)

// Tanggal kosong = hari ini menurut server (dipakai saat memuat).
const today = toISODate(new Date())
const date = computed(() => query.value.date || today)
const dateValue = computed({
  get: () => fromISODate(date.value),
  set: (value) =>
    update({ date: toISODate(value) === today ? '' : (toISODate(value) ?? ''), page: 1 }),
})

const list = usePagedList((params) => listRecords(params))
async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: PAGE_SIZE,
      date: date.value,
      classId: query.value.class_id || undefined,
      status: query.value.status || undefined,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const unassigned = ref([])
const unassignedVisible = ref(false)
watch(
  () => [school.ready.value, school.scopeId.value],
  async ([ready]) => {
    if (!ready) return
    unassigned.value = await listUnassignedStudents(scope()).catch(() => [])
  },
  { immediate: true },
)

// ---- Koreksi ----
const editing = ref(null)
const correctionVisible = ref(false)
const canEdit = (item) => (item.status ? can.value.update : can.value.create)
function openCorrection(item) {
  editing.value = item
  correctionVisible.value = true
}
async function saveCorrection(values) {
  await correctRecord(editing.value.studentId, date.value, values, scope())
  notify.success(`Presensi ${editing.value.name} disimpan`)
  await list.reload()
}

const deleting = ref(null)
const deleteVisible = ref(false)
function openDelete(item) {
  deleting.value = item
  deleteVisible.value = true
}
async function removeRecord(reason) {
  await deleteRecord(deleting.value.studentId, date.value, reason, scope())
  notify.success(`Presensi ${deleting.value.name} dihapus`)
  await list.reload()
}

// ---- Selfie ----
const selfie = ref({ visible: false, item: null, url: '', loading: false })
async function openSelfie(item) {
  selfie.value = { visible: true, item, url: '', loading: true }
  try {
    selfie.value.url = (await getSelfieUrl(item.studentId, date.value, scope())).url
  } catch (error) {
    notify.error(error)
    selfie.value.visible = false
  } finally {
    selfie.value.loading = false
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Data Presensi"
      description="Presensi harian siswa, koreksi manual, dan foto selfie"
    />

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <Message v-if="unassigned.length" severity="warn" :closable="false">
        {{ unassigned.length }} siswa aktif belum punya kelas pada semester ini, sehingga tidak bisa
        presensi dan tidak tercatat alpa.
        <Button label="Lihat" size="small" text @click="unassignedVisible = true" />
        <RouterLink v-if="canClasses.view" :to="{ name: 'classes' }" class="link-strong"
          >Atur kelas</RouterLink
        >
      </Message>

      <Card>
        <template #content>
          <div class="form-stack">
            <div class="toolbar">
              <DatePicker
                v-model="dateValue"
                class="toolbar__filter"
                date-format="dd/mm/yy"
                :max-date="new Date()"
                show-icon
                icon-display="input"
                aria-label="Tanggal"
              />
              <IconField class="toolbar__search">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchInput"
                  placeholder="Cari nama atau NIS"
                  aria-label="Cari siswa"
                  fluid
                />
              </IconField>
              <Select
                class="toolbar__filter"
                :model-value="query.class_id || null"
                :options="classes.options.value"
                option-label="label"
                option-value="value"
                placeholder="Semua kelas"
                aria-label="Filter kelas"
                show-clear
                filter
                @update:model-value="(value) => update({ class_id: value ?? '', page: 1 })"
              />
              <Select
                class="toolbar__filter"
                :model-value="query.status || null"
                :options="RECORD_STATUS_FILTERS"
                option-label="label"
                option-value="value"
                placeholder="Semua status"
                aria-label="Filter status"
                show-clear
                @update:model-value="(value) => update({ status: value ?? '', page: 1 })"
              />
            </div>
            <DataTable
              :value="list.items.value"
              :loading="list.loading.value"
              :total-records="list.meta.value.total"
              :rows="PAGE_SIZE"
              :first="(query.page - 1) * PAGE_SIZE"
              data-key="studentId"
              lazy
              paginator
              paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              current-page-report-template="{first}–{last} dari {totalRecords} siswa"
              striped-rows
              @page="(event) => update({ page: event.page + 1 })"
            >
              <template #empty>
                <EmptyState
                  icon="pi pi-list"
                  title="Tidak ada data"
                  :description="`Tidak ada siswa berkelas yang cocok untuk ${formatDate(date)}.`"
                />
              </template>
              <Column header="Siswa">
                <template #body="{ data }">
                  {{ data.name }}
                  <div class="text-muted">{{ data.nis }} · {{ data.className ?? '-' }}</div>
                </template>
              </Column>
              <Column header="Status">
                <template #body="{ data }">
                  <Tag
                    :value="attendanceStatusOf(data.status).label"
                    :severity="attendanceStatusOf(data.status).severity"
                  />
                  <div v-if="data.lateMinutes" class="text-muted">{{ data.lateMinutes }} menit</div>
                </template>
              </Column>
              <Column header="Jam">
                <template #body="{ data }">{{ wallTime(data.checkedInAt) }}</template>
              </Column>
              <Column header="Sumber">
                <template #body="{ data }">
                  <span class="text-muted">{{ SOURCE_LABELS[data.source] ?? '-' }}</span>
                  <div v-if="data.withinGeofence === false">
                    <Tag value="Di luar area" severity="warn" icon="pi pi-map-marker" />
                  </div>
                </template>
              </Column>
              <Column header="Aksi">
                <template #body="{ data }">
                  <div class="row-actions">
                    <Button
                      v-if="data.hasSelfie"
                      v-tooltip.top="'Lihat selfie'"
                      icon="pi pi-image"
                      severity="secondary"
                      text
                      rounded
                      :aria-label="`Selfie ${data.name}`"
                      @click="openSelfie(data)"
                    />
                    <Button
                      v-if="canEdit(data)"
                      v-tooltip.top="data.status ? 'Koreksi' : 'Tambah manual'"
                      :icon="data.status ? 'pi pi-pencil' : 'pi pi-plus'"
                      severity="secondary"
                      text
                      rounded
                      :aria-label="`${data.status ? 'Koreksi' : 'Tambah'} presensi ${data.name}`"
                      @click="openCorrection(data)"
                    />
                    <Button
                      v-if="data.status && can.delete"
                      v-tooltip.top="'Hapus'"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      :aria-label="`Hapus presensi ${data.name}`"
                      @click="openDelete(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>
    </template>

    <CorrectionDialog
      v-model:visible="correctionVisible"
      :item="editing"
      :date="date"
      :submit="saveCorrection"
    />
    <NoteDialog
      v-model:visible="deleteVisible"
      :header="`Hapus presensi ${deleting?.name ?? ''}`"
      message="Pada hari yang sudah ditutup, presensi diganti menjadi alpa; selain itu presensi dikosongkan."
      label="Alasan"
      field="reason"
      confirm-label="Hapus"
      confirm-icon="pi pi-trash"
      danger
      :submit="removeRecord"
    />

    <Dialog
      v-model:visible="selfie.visible"
      :header="`Selfie ${selfie.item?.name ?? ''}`"
      :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
      modal
    >
      <div class="selfie-view">
        <ProgressSpinner v-if="selfie.loading" style="width: 2.5rem" />
        <img v-else-if="selfie.url" :src="selfie.url" :alt="`Selfie ${selfie.item?.name}`" />
        <p class="text-muted">
          {{ formatDate(date) }} · pukul {{ wallTime(selfie.item?.checkedInAt) }}. Tautan foto
          berlaku beberapa menit.
        </p>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="unassignedVisible"
      header="Siswa aktif tanpa kelas"
      :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
      modal
    >
      <DataTable :value="unassigned" data-key="studentId" size="small">
        <Column field="name" header="Nama" />
        <Column field="nis" header="NIS" />
        <Column field="nisn" header="NISN" />
      </DataTable>
    </Dialog>
  </div>
</template>
