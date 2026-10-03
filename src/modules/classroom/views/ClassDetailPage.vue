<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useAcademicCalendar, useSchoolContext } from '@/modules/academic'
import {
  getClass,
  listAssignableStudents,
  listClassOptions,
  listMembers,
  removeMember,
  setMembers,
} from '../api/classroom.api'
import AddMembersDialog from '../components/AddMembersDialog.vue'
import MoveMemberDialog from '../components/MoveMemberDialog.vue'

const route = useRoute()
const router = useRouter()
const can = useCan('classes')
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({
  school_id: { type: 'string' },
  semester: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const calendar = useAcademicCalendar(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value })

const classroom = ref(null)
const loadError = ref(null)
const members = ref([])
const loadingMembers = ref(false)

const semesters = computed(() =>
  classroom.value ? calendar.semestersOfYear(classroom.value.academicYearId) : [],
)
const semesterId = computed(() => {
  const ids = semesters.value.map((s) => s.id)
  if (ids.includes(query.value.semester)) return query.value.semester
  const active = calendar.activeSemester.value
  return active && ids.includes(active.id) ? active.id : (semesters.value.at(-1)?.id ?? null)
})
const semester = computed(() => calendar.semesterOf(semesterId.value))
const semesterOptions = computed(() =>
  semesters.value.map((s) => ({ value: s.id, label: s.label })),
)

async function loadClass() {
  loadError.value = null
  try {
    classroom.value = await getClass(route.params.id, scope())
  } catch (error) {
    loadError.value = error
  }
}

async function loadMembers() {
  if (!classroom.value || !semesterId.value) return
  loadingMembers.value = true
  try {
    members.value = await listMembers(classroom.value.id, {
      semesterId: semesterId.value,
      ...scope(),
    })
  } catch (error) {
    notify.error(error)
  } finally {
    loadingMembers.value = false
  }
}

watch(
  () => [route.params.id, school.ready.value],
  ([id, ready]) => id && ready && loadClass(),
  { immediate: true },
)
watch([() => classroom.value?.id, semesterId], loadMembers)

// ---- Tambah anggota ----
const addVisible = ref(false)
const loadAssignable = (search) =>
  listAssignableStudents({ ...scope(), semesterId: semesterId.value, search })

async function addMembers(studentIds) {
  members.value = await setMembers(
    classroom.value.id,
    { semesterId: semesterId.value, studentIds },
    scope(),
  )
  notify.success(`${studentIds.length} siswa ditambahkan ke ${classroom.value.name}`)
}

// ---- Pindah kelas ----
const moveVisible = ref(false)
const moving = ref(null)
const otherClasses = ref([])

async function openMove(member) {
  moving.value = member
  try {
    const options = await listClassOptions({
      ...scope(),
      academicYearId: classroom.value.academicYearId,
    })
    otherClasses.value = options.filter((c) => c.id !== classroom.value.id)
    moveVisible.value = true
  } catch (error) {
    notify.error(error)
  }
}

async function moveMember(targetClassId) {
  await setMembers(
    targetClassId,
    { semesterId: semesterId.value, studentIds: [moving.value.studentId] },
    scope(),
  )
  const target = otherClasses.value.find((c) => c.id === targetClassId)
  notify.success(`${moving.value.name} dipindahkan ke ${target?.name ?? 'kelas lain'}`)
  await loadMembers()
}

// ---- Keluarkan ----
async function remove(member) {
  const confirmed = await ask({
    header: 'Keluarkan dari kelas',
    message: `Keluarkan ${member.name} dari ${classroom.value.name} pada semester ${semester.value?.label ?? ''}? Data siswa tidak dihapus.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Keluarkan',
    danger: true,
  })
  if (!confirmed) return
  try {
    await removeMember(classroom.value.id, member.studentId, {
      semesterId: semesterId.value,
      ...scope(),
    })
    notify.success(`${member.name} dikeluarkan dari kelas`)
    await loadMembers()
  } catch (error) {
    notify.error(error)
  }
}

const backToList = () =>
  router.push({
    name: 'classes',
    query: { year: classroom.value?.academicYearId, school_id: school.scopeId.value || undefined },
  })
</script>

<template>
  <div class="page">
    <PageHeader
      :title="classroom ? `Kelas ${classroom.name}` : 'Kelas'"
      :description="
        classroom
          ? `Tingkat ${classroom.gradeLevel} · Wali kelas: ${classroom.homeroomName || 'belum ada'}`
          : ''
      "
    >
      <template #actions>
        <Button
          label="Daftar kelas"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="backToList"
        />
        <Button
          v-if="can.update && classroom && semesterId"
          label="Tambah siswa"
          icon="pi pi-user-plus"
          @click="addVisible = true"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Kelas tidak dapat dimuat"
      :description="loadError.message"
    />

    <Card v-else-if="classroom">
      <template #content>
        <div class="form-stack">
          <div class="toolbar">
            <Select
              class="toolbar__filter toolbar__filter--wide"
              :model-value="semesterId"
              :options="semesterOptions"
              option-label="label"
              option-value="value"
              aria-label="Semester"
              @update:model-value="(value) => update({ semester: value })"
            />
            <Tag :value="`${members.length} siswa`" severity="secondary" />
          </div>
          <Message
            v-if="!semesters.length && !calendar.loading.value"
            severity="warn"
            :closable="false"
          >
            Tahun pelajaran kelas ini tidak memiliki semester.
          </Message>

          <DataTable :value="members" :loading="loadingMembers" data-key="studentId" striped-rows>
            <template #empty>
              <EmptyState
                icon="pi pi-users"
                title="Belum ada anggota"
                description="Tambahkan siswa ke kelas ini untuk semester yang dipilih."
              />
            </template>
            <Column header="No">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column field="name" header="Nama" />
            <Column field="nis" header="NIS" />
            <Column header="NISN">
              <template #body="{ data }">{{ data.nisn || '-' }}</template>
            </Column>
            <Column header="L/P">
              <template #body="{ data }">{{ data.gender || '-' }}</template>
            </Column>
            <Column v-if="can.update" header="Aksi">
              <template #body="{ data }">
                <div class="row-actions">
                  <Button
                    v-tooltip.top="'Pindah kelas'"
                    icon="pi pi-arrow-right-arrow-left"
                    severity="secondary"
                    text
                    rounded
                    :aria-label="`Pindahkan ${data.name}`"
                    @click="openMove(data)"
                  />
                  <Button
                    v-tooltip.top="'Keluarkan dari kelas'"
                    icon="pi pi-sign-out"
                    severity="danger"
                    text
                    rounded
                    :aria-label="`Keluarkan ${data.name}`"
                    @click="remove(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <AddMembersDialog
      v-model:visible="addVisible"
      :class-name="classroom?.name"
      :semester-label="semester?.label"
      :load="loadAssignable"
      :submit="addMembers"
    />
    <MoveMemberDialog
      v-model:visible="moveVisible"
      :student="moving"
      :classes="otherClasses"
      :submit="moveMember"
    />
  </div>
</template>
