<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import {
  approveLeave,
  getLeave,
  getLeaveFileUrl,
  listLeaves,
  rejectLeave,
  revokeLeave,
} from '../api/leave.api'
import LeaveDetail from '../components/LeaveDetail.vue'
import NoteDialog from '../components/NoteDialog.vue'
import { useClassOptions } from '../composables/useClassOptions'
import { LEAVE_STATUSES, leaveStatusOf, leaveTypeLabel } from '../constants'

const can = useCan('attendance_leaves')
const notify = useNotify()

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  ...LEAVE_STATUSES.map(({ value, label }) => ({ value, label })),
]

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  status: {
    type: 'string',
    options: ['pending', 'approved', 'rejected', 'cancelled', 'all'],
    default: 'pending',
  },
  class_id: { type: 'string' },
  search: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const classes = useClassOptions(school)
const status = computed(() => query.value.status || 'pending')

const list = usePagedList((params) => listLeaves(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      status: status.value === 'all' ? undefined : status.value,
      classId: query.value.class_id || undefined,
      search: query.value.search,
    })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

// ---- Detail & keputusan ----
const detail = ref(null)
const detailVisible = ref(false)
const approveNote = ref('')
const approving = ref(false)

async function open(leave) {
  detail.value = leave
  approveNote.value = ''
  detailVisible.value = true
  try {
    detail.value = await getLeave(leave.id, scope())
  } catch {
    // Data daftar sudah cukup.
  }
}

function applied(leave) {
  detail.value = leave
  list.replaceItem(leave)
}

async function handleConflict(error) {
  notify.error(error)
  if (error.code === 'LEAVE_NOT_PENDING') {
    await list.reload()
    detailVisible.value = false
  }
}

async function approve() {
  approving.value = true
  try {
    const leave = await approveLeave(detail.value.id, approveNote.value.trim(), scope())
    applied(leave)
    notify.success(
      `Izin ${leave.student?.name ?? ''} disetujui: ${leave.appliedDays ?? 0} hari presensi dicatat ${leaveTypeLabel(leave.leaveType).toLowerCase()}`,
    )
    detailVisible.value = false
    await list.reload()
  } catch (error) {
    await handleConflict(error)
  } finally {
    approving.value = false
  }
}

const noteDialog = ref({ visible: false, action: null })
const NOTE_ACTIONS = {
  reject: {
    header: 'Tolak izin',
    message: 'Data presensi tidak berubah. Alasan penolakan terlihat oleh siswa.',
    label: 'Alasan penolakan',
    confirmLabel: 'Tolak',
    confirmIcon: 'pi pi-times',
    run: rejectLeave,
    done: 'Izin ditolak',
  },
  revoke: {
    header: 'Batalkan persetujuan',
    message:
      'Hari yang sudah ditutup menjadi alpa; hari yang belum ditutup dikosongkan sehingga siswa bisa presensi.',
    label: 'Alasan pembatalan',
    confirmLabel: 'Batalkan persetujuan',
    confirmIcon: 'pi pi-undo',
    run: revokeLeave,
    done: 'Persetujuan izin dibatalkan',
  },
}
const noteAction = computed(() => NOTE_ACTIONS[noteDialog.value.action] ?? NOTE_ACTIONS.reject)

async function submitNote(note) {
  try {
    const leave = await noteAction.value.run(detail.value.id, note, scope())
    applied(leave)
    notify.success(noteAction.value.done)
    detailVisible.value = false
    await list.reload()
  } catch (error) {
    if (error.code === 'LEAVE_NOT_PENDING') {
      await handleConflict(error)
      return
    }
    throw error
  }
}

const range = (l) =>
  l.startDate === l.endDate
    ? formatDate(l.startDate)
    : `${formatDate(l.startDate)} – ${formatDate(l.endDate)}`
</script>

<template>
  <div class="page">
    <PageHeader
      title="Persetujuan Izin"
      description="Periksa bukti lalu setujui atau tolak pengajuan izin siswa"
    />

    <SchoolContextBar :context="school" />

    <Card v-if="school.ready.value">
      <template #content>
        <div class="form-stack">
          <SelectButton
            :model-value="status"
            :options="STATUS_TABS"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-label="Status izin"
            class="status-tabs"
            @update:model-value="(value) => update({ status: value, page: 1 })"
          />
          <div class="toolbar">
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
            current-page-report-template="{first}–{last} dari {totalRecords} izin"
            striped-rows
            row-hover
            class="clickable-rows"
            @row-click="(event) => open(event.data)"
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState
                icon="pi pi-inbox"
                :title="status === 'pending' ? 'Tidak ada izin yang menunggu' : 'Tidak ada izin'"
              />
            </template>
            <Column header="Siswa">
              <template #body="{ data }">
                {{ data.student?.name }}
                <div class="text-muted">
                  {{ data.student?.nis }} · {{ data.student?.className ?? '-' }}
                </div>
              </template>
            </Column>
            <Column header="Tanggal">
              <template #body="{ data }">
                {{ range(data) }}
                <div class="text-muted">
                  {{ data.days }} hari · {{ leaveTypeLabel(data.leaveType) }}
                </div>
              </template>
            </Column>
            <Column header="Alasan">
              <template #body="{ data }"
                ><span class="question-cell__text">{{ data.reason }}</span></template
              >
            </Column>
            <Column header="Bukti">
              <template #body="{ data }">
                <span :class="{ 'text-muted': !data.fileCount }"
                  ><i class="pi pi-paperclip" aria-hidden="true" /> {{ data.fileCount }}</span
                >
              </template>
            </Column>
            <Column header="Diajukan">
              <template #body="{ data }"
                ><span class="text-muted">{{ formatDateTime(data.submittedAt) }}</span></template
              >
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag
                  :value="leaveStatusOf(data.status).label"
                  :severity="leaveStatusOf(data.status).severity"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="detailVisible"
      :header="detail?.student ? `Izin ${detail.student.name}` : 'Detail izin'"
      :style="{ width: 'min(40rem, calc(100vw - 2rem))' }"
      modal
    >
      <div v-if="detail" class="form-stack">
        <LeaveDetail
          :leave="detail"
          :resolve-url="(mediaId) => getLeaveFileUrl(detail.id, mediaId, scope())"
          show-student
          preview-images
        />
        <div v-if="detail.status === 'pending' && can.update" class="form-field">
          <label class="form-field__label" for="approve-note">Catatan persetujuan (opsional)</label>
          <Textarea id="approve-note" v-model="approveNote" rows="2" maxlength="1000" fluid />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <template v-if="detail?.status === 'pending' && can.update">
            <Button
              label="Tolak"
              icon="pi pi-times"
              severity="danger"
              outlined
              @click="noteDialog = { visible: true, action: 'reject' }"
            />
            <Button label="Setujui" icon="pi pi-check" :loading="approving" @click="approve" />
          </template>
          <template v-else>
            <Button
              v-if="detail?.status === 'approved' && can.update"
              label="Batalkan persetujuan"
              icon="pi pi-undo"
              severity="danger"
              text
              @click="noteDialog = { visible: true, action: 'revoke' }"
            />
            <Button label="Tutup" severity="secondary" outlined @click="detailVisible = false" />
          </template>
        </div>
      </template>
    </Dialog>

    <NoteDialog
      v-model:visible="noteDialog.visible"
      :header="noteAction.header"
      :message="noteAction.message"
      :label="noteAction.label"
      :confirm-label="noteAction.confirmLabel"
      :confirm-icon="noteAction.confirmIcon"
      danger
      :submit="submitNote"
    />
  </div>
</template>
