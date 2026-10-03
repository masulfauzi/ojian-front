<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { formatDate } from '@/shared/utils/format'
import { useCan } from '@/modules/auth'
import {
  TERM_GANJIL,
  TERM_GENAP,
  activateSemester,
  copyMemberships,
  createAcademicYear,
  deleteAcademicYear,
  updateAcademicYear,
  updateSemester,
} from '../api/academic.api'
import SchoolContextBar from '../components/SchoolContextBar.vue'
import SemesterDatesDialog from '../components/SemesterDatesDialog.vue'
import YearFormDialog from '../components/YearFormDialog.vue'
import { useAcademicCalendar } from '../composables/useAcademicCalendar'
import { useSchoolContext } from '../composables/useSchoolContext'

const can = useCan('academic_years')
const canClasses = useCan('classes')
const notify = useNotify()
const { ask, confirmDelete } = useConfirm()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value })

const range = (item) => `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`
const active = computed(() => calendar.activeSemester.value)

// ---- Tahun pelajaran ----
const yearDialog = ref(false)
const editingYear = ref(null)
const existingNames = computed(() => calendar.years.value.map((y) => y.name))

function openCreateYear() {
  editingYear.value = null
  yearDialog.value = true
}

function openEditYear(year) {
  editingYear.value = year
  yearDialog.value = true
}

async function saveYear(values) {
  if (editingYear.value) {
    await updateAcademicYear(editingYear.value.id, values, scope())
    notify.success('Tahun pelajaran berhasil diperbarui')
  } else {
    await createAcademicYear(values, scope())
    notify.success(`Tahun pelajaran ${values.name} beserta dua semesternya berhasil dibuat`)
  }
  await calendar.reload()
}

async function removeYear(year) {
  if (!(await confirmDelete(`tahun pelajaran ${year.name} beserta kedua semesternya`))) return
  try {
    await deleteAcademicYear(year.id, scope())
    notify.success('Tahun pelajaran berhasil dihapus')
    await calendar.reload()
  } catch (error) {
    notify.error(error)
  }
}

// ---- Semester ----
const semesterDialog = ref(false)
const editingSemester = ref(null)
const semesterYear = ref(null)

function openEditSemester(year, semester) {
  semesterYear.value = year
  editingSemester.value = semester
  semesterDialog.value = true
}

async function saveSemester(values) {
  await updateSemester(editingSemester.value.id, values, scope())
  notify.success('Tanggal semester berhasil diperbarui')
  await calendar.reload()
}

const busy = ref(null)

async function activate(year, semester) {
  const current = active.value
  const confirmed = await ask({
    header: 'Aktifkan semester',
    message: `Jadikan ${year.name} · ${semester.termName} sebagai semester aktif?${
      current ? ` Semester ${current.label.replace(' (aktif)', '')} akan dinonaktifkan.` : ''
    } Data kelas dan siswa memakai semester aktif sebagai default.`,
    acceptLabel: 'Aktifkan',
  })
  if (!confirmed) return
  busy.value = semester.id
  try {
    await activateSemester(semester.id, scope())
    notify.success(`${year.name} · ${semester.termName} sekarang aktif`)
    await calendar.reload()
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = null
  }
}

async function copyFromGanjil(year, genap) {
  const ganjil = year.semesters.find((s) => s.term === TERM_GANJIL)
  const confirmed = await ask({
    header: 'Salin anggota kelas',
    message: `Salin keanggotaan kelas dari semester Ganjil ke Genap ${year.name}? Siswa yang sudah punya kelas di semester Genap dilewati.`,
    acceptLabel: 'Salin',
  })
  if (!confirmed) return
  busy.value = genap.id
  try {
    const { copied } = await copyMemberships(genap.id, ganjil.id, scope())
    notify.success(`${copied} keanggotaan kelas disalin ke semester Genap`)
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      title="Tahun Pelajaran & Semester"
      description="Kalender akademik sekolah. Satu semester aktif menjadi acuan kelas dan siswa."
    >
      <template #actions>
        <Button
          v-if="can.create && school.ready.value"
          label="Tambah tahun pelajaran"
          icon="pi pi-plus"
          @click="openCreateYear"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <Message v-if="active" severity="success" :closable="false" icon="pi pi-calendar">
        Semester aktif: <strong>{{ active.yearName }} · {{ active.termName }}</strong> ({{
          range(active)
        }})
      </Message>
      <Message v-else-if="!calendar.loading.value" severity="warn" :closable="false">
        Belum ada semester aktif. Aktifkan salah satu semester agar kelas dan siswa bisa dikelola.
      </Message>

      <div v-if="calendar.loading.value && !calendar.years.value.length" class="center-block">
        <ProgressSpinner style="width: 3rem" />
      </div>

      <EmptyState
        v-else-if="calendar.error.value"
        icon="pi pi-exclamation-circle"
        title="Gagal memuat tahun pelajaran"
        :description="calendar.error.value.message"
      >
        <Button label="Coba lagi" icon="pi pi-refresh" @click="calendar.reload" />
      </EmptyState>

      <Card v-else-if="!calendar.years.value.length">
        <template #content>
          <EmptyState
            icon="pi pi-calendar"
            title="Belum ada tahun pelajaran"
            description="Buat tahun pelajaran pertama; semester Ganjil dan Genap dibuat otomatis."
          >
            <Button
              v-if="can.create"
              label="Tambah tahun pelajaran"
              icon="pi pi-plus"
              @click="openCreateYear"
            />
          </EmptyState>
        </template>
      </Card>

      <div v-else class="year-list">
        <Card v-for="year in calendar.years.value" :key="year.id" class="year-card">
          <template #title>
            <div class="year-card__header">
              <div>
                <span>{{ year.name }}</span>
                <Tag v-if="year.isActive" value="Aktif" severity="success" class="year-card__tag" />
                <div class="text-muted year-card__range">{{ range(year) }}</div>
              </div>
              <div class="row-actions">
                <Button
                  v-if="can.update"
                  v-tooltip.top="'Ubah'"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  :aria-label="`Ubah ${year.name}`"
                  @click="openEditYear(year)"
                />
                <Button
                  v-if="can.delete"
                  v-tooltip.top="'Hapus'"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  :aria-label="`Hapus ${year.name}`"
                  @click="removeYear(year)"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div class="semester-list">
              <div
                v-for="semester in year.semesters"
                :key="semester.id"
                class="semester-row"
                :class="{ 'is-active': semester.isActive }"
              >
                <div class="semester-row__info">
                  <span class="semester-row__name">Semester {{ semester.termName }}</span>
                  <Tag
                    v-if="semester.isActive"
                    value="Aktif"
                    severity="success"
                    icon="pi pi-check"
                  />
                  <span class="text-muted">{{ range(semester) }}</span>
                </div>
                <div class="semester-row__actions">
                  <Button
                    v-if="
                      canClasses.update &&
                      semester.term === TERM_GENAP &&
                      year.semesters.length === 2
                    "
                    label="Salin anggota dari Ganjil"
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    size="small"
                    :loading="busy === semester.id"
                    @click="copyFromGanjil(year, semester)"
                  />
                  <Button
                    v-if="can.update"
                    label="Ubah tanggal"
                    icon="pi pi-calendar"
                    severity="secondary"
                    text
                    size="small"
                    @click="openEditSemester(year, semester)"
                  />
                  <Button
                    v-if="can.update && !semester.isActive"
                    label="Aktifkan"
                    icon="pi pi-check-circle"
                    size="small"
                    outlined
                    :loading="busy === semester.id"
                    @click="activate(year, semester)"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>

    <YearFormDialog
      v-model:visible="yearDialog"
      :year="editingYear"
      :existing-names="existingNames"
      :submit="saveYear"
    />
    <SemesterDatesDialog
      v-model:visible="semesterDialog"
      :semester="editingSemester"
      :year="semesterYear"
      :submit="saveSemester"
    />
  </div>
</template>
