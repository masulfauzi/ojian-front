<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState } from '@/shared/composables/useQueryState'
import { toISODate } from '@/shared/utils/date'
import { formatDate } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import {
  cancelLeave,
  createLeave,
  getLeave,
  getLeaveFileUrl,
  listMyLeaves,
  uploadLeaveProof,
} from '../api/leave.api'
import LeaveDetail from '../components/LeaveDetail.vue'
import LeaveFormDialog from '../components/LeaveFormDialog.vue'
import { leaveStatusOf, leaveTypeLabel } from '../constants'

const route = useRoute()
const router = useRouter()
const can = useCan('my_leaves')
const notify = useNotify()
const { ask } = useConfirm()

const { query, update, isActiveRoute } = useQueryState({ page: { type: 'page' } })
const list = usePagedList((params) => listMyLeaves(params))
// Tanggal perangkat cukup untuk nilai awal form; batas sebenarnya diperiksa server.
const today = toISODate(new Date())

async function load() {
  try {
    await list.fetch({ page: query.value.page, limit: DEFAULT_PAGE_SIZE })
  } catch (error) {
    notify.error(error)
  }
}
watch(query, () => isActiveRoute() && load(), { immediate: true })

const formVisible = ref(false)
onMounted(() => {
  // Dari tombol "Ajukan izin" di halaman presensi.
  if (route.query.new && can.value.create) {
    formVisible.value = true
    router.replace({ query: { ...route.query, new: undefined } })
  }
})

async function submit(values) {
  const leave = await createLeave(values)
  notify.success('Pengajuan izin terkirim. Tunggu persetujuan admin presensi.')
  await list.reload()
  open(leave)
}

const detail = ref(null)
const detailVisible = ref(false)
async function open(leave) {
  detail.value = leave
  detailVisible.value = true
  try {
    detail.value = await getLeave(leave.id)
  } catch {
    // Data daftar sudah cukup untuk ditampilkan.
  }
}

async function cancel() {
  const ok = await ask({
    header: 'Batalkan pengajuan',
    message: 'Pengajuan izin ini dibatalkan dan tidak akan diproses. Lanjutkan?',
    acceptLabel: 'Batalkan pengajuan',
    rejectLabel: 'Kembali',
    danger: true,
  })
  if (!ok) return
  try {
    detail.value = await cancelLeave(detail.value.id)
    list.replaceItem(detail.value)
    notify.success('Pengajuan izin dibatalkan')
  } catch (error) {
    notify.error(error)
    if (error.code === 'LEAVE_NOT_PENDING') await list.reload()
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
      title="Izin Saya"
      description="Ajukan izin atau sakit beserta bukti, lalu tunggu persetujuan"
    >
      <template #actions>
        <Button
          v-if="can.create"
          label="Ajukan izin"
          icon="pi pi-plus"
          @click="formVisible = true"
        />
      </template>
    </PageHeader>

    <Card>
      <template #content>
        <DataTable
          :value="list.items.value"
          :loading="list.loading.value"
          :total-records="list.meta.value.total"
          :rows="DEFAULT_PAGE_SIZE"
          :first="(query.page - 1) * DEFAULT_PAGE_SIZE"
          data-key="id"
          lazy
          paginator
          :always-show-paginator="false"
          paginator-template="PrevPageLink PageLinks NextPageLink CurrentPageReport"
          current-page-report-template="{totalRecords} pengajuan"
          striped-rows
          row-hover
          class="clickable-rows"
          @row-click="(event) => open(event.data)"
          @page="(event) => update({ page: event.page + 1 })"
        >
          <template #empty>
            <EmptyState
              icon="pi pi-file"
              title="Belum ada pengajuan izin"
              description="Ajukan izin atau sakit bila tidak dapat masuk sekolah."
            />
          </template>
          <Column header="Tanggal">
            <template #body="{ data }">
              {{ range(data) }}
              <div class="text-muted">{{ data.days }} hari</div>
            </template>
          </Column>
          <Column header="Jenis">
            <template #body="{ data }">{{ leaveTypeLabel(data.leaveType) }}</template>
          </Column>
          <Column header="Alasan">
            <template #body="{ data }"
              ><span class="question-cell__text">{{ data.reason }}</span></template
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
          <Column header="">
            <template #body="{ data }">
              <Button
                icon="pi pi-angle-right"
                severity="secondary"
                text
                rounded
                :aria-label="`Detail izin ${range(data)}`"
                @click.stop="open(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <LeaveFormDialog
      v-model:visible="formVisible"
      :today="today"
      :submit="submit"
      :upload="uploadLeaveProof"
    />

    <Dialog
      v-model:visible="detailVisible"
      header="Detail izin"
      :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
      modal
    >
      <LeaveDetail
        v-if="detail"
        :leave="detail"
        :resolve-url="(mediaId) => getLeaveFileUrl(detail.id, mediaId)"
      />
      <template #footer>
        <div class="dialog-footer">
          <Button
            v-if="detail?.status === 'pending' && can.update"
            label="Batalkan pengajuan"
            icon="pi pi-times"
            severity="danger"
            text
            @click="cancel"
          />
          <Button label="Tutup" severity="secondary" outlined @click="detailVisible = false" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
