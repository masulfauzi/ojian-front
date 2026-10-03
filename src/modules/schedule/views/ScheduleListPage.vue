<script setup>
import { computed, watch } from 'vue'
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
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/composables/usePagedList'
import { useQueryState, useSearchInput } from '@/shared/composables/useQueryState'
import { formatZonedRange } from '@/shared/utils/zonedTime'
import { useAuthStore, useCan } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import { listSchedules } from '../api/schedule.api'
import ScheduleStateTags from '../components/ScheduleStateTags.vue'
import { SCHEDULE_STATUSES, categoryLabel } from '../constants'

const props = defineProps({
  /** Dipakai ulang oleh halaman Pemantauan/Hasil: judul, deskripsi, dan tujuan klik baris. */
  title: { type: String, default: 'Jadwal Ujian' },
  description: {
    type: String,
    default: 'Atur waktu, kelas peserta, token, dan aturan hasil untuk paket ujian',
  },
  /** Nama route tujuan saat jadwal dipilih. */
  target: { type: String, default: 'schedule-detail' },
  /** Hanya jadwal yang sudah dipublikasikan (pemantauan & hasil). */
  publishedOnly: { type: Boolean, default: false },
  showCreate: { type: Boolean, default: true },
})

const router = useRouter()
const auth = useAuthStore()
const can = useCan('exam_schedules')
const notify = useNotify()

const { query, update, isActiveRoute } = useQueryState({
  school_id: { type: 'string' },
  page: { type: 'page' },
  search: { type: 'string' },
  semester: { type: 'string' },
  status: { type: 'string', options: ['draft', 'published', 'cancelled'] },
  mine: { type: 'boolean' },
})
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const searchInput = useSearchInput(
  () => query.value.search,
  (search) => update({ search, page: 1 }),
)
const canCreate = computed(() => props.showCreate && can.value.create && !auth.isPlatformUser)
const semesterOptions = computed(() =>
  calendar.semesters.value.map((s) => ({ value: s.id, label: s.label })),
)

const list = usePagedList((params) => listSchedules(params))

async function load() {
  try {
    await list.fetch({
      ...scope(),
      page: query.value.page,
      limit: DEFAULT_PAGE_SIZE,
      search: query.value.search,
      semesterId: query.value.semester || undefined,
      status: props.publishedOnly ? 'published' : query.value.status || undefined,
      mine: query.value.mine === true,
    })
  } catch (error) {
    notify.error(error)
  }
}

watch(query, () => isActiveRoute() && school.ready.value && load(), { immediate: true })

const open = (schedule) =>
  router.push({
    name: props.target,
    params: { id: schedule.id },
    query: school.scopeId.value ? { school_id: school.scopeId.value } : {},
  })
</script>

<template>
  <div class="page">
    <PageHeader :title="title" :description="description">
      <template v-if="school.ready.value && canCreate" #actions>
        <Button
          label="Buat jadwal"
          icon="pi pi-plus"
          @click="router.push({ name: 'schedule-new' })"
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
                placeholder="Cari judul jadwal atau paket"
                aria-label="Cari jadwal"
                fluid
              />
            </IconField>
            <Select
              class="toolbar__filter"
              :model-value="query.semester || null"
              :options="semesterOptions"
              option-label="label"
              option-value="value"
              placeholder="Semua semester"
              aria-label="Filter semester"
              show-clear
              @update:model-value="(value) => update({ semester: value ?? '', page: 1 })"
            />
            <Select
              v-if="!publishedOnly"
              class="toolbar__filter"
              :model-value="query.status || null"
              :options="SCHEDULE_STATUSES"
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
              Jadwal saya
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
            current-page-report-template="{first}–{last} dari {totalRecords} jadwal"
            striped-rows
            @page="(event) => update({ page: event.page + 1 })"
          >
            <template #empty>
              <EmptyState
                icon="pi pi-calendar"
                :title="
                  publishedOnly ? 'Belum ada jadwal yang dipublikasikan' : 'Belum ada jadwal ujian'
                "
                description="Jadwal dibuat dari paket ujian yang sudah dipublikasikan."
              />
            </template>
            <Column header="Jadwal">
              <template #body="{ data }">
                <a href="#" class="link-strong" @click.prevent="open(data)">{{ data.title }}</a>
                <div class="text-muted">
                  {{ data.examTitle }} · {{ categoryLabel(data.category) }}
                </div>
              </template>
            </Column>
            <Column header="Waktu">
              <template #body="{ data }">
                {{ formatZonedRange(data.startsAt, data.endsAt, data.timezone) }}
                <div class="text-muted">Durasi {{ data.durationMinutes }} menit</div>
              </template>
            </Column>
            <Column header="Mapel">
              <template #body="{ data }">{{ data.subjectName ?? '-' }}</template>
            </Column>
            <Column header="Status">
              <template #body="{ data }"><ScheduleStateTags :schedule="data" /></template>
            </Column>
            <Column header="Pembuat">
              <template #body="{ data }"
                ><span class="text-muted">{{ data.creatorName ?? '-' }}</span></template
              >
            </Column>
            <Column header="">
              <template #body="{ data }">
                <Button
                  icon="pi pi-angle-right"
                  severity="secondary"
                  text
                  rounded
                  :aria-label="`Buka ${data.title}`"
                  @click="open(data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>
