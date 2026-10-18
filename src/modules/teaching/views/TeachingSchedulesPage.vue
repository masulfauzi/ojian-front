<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { useTeacherOptions } from '@/modules/classroom'
import { getJournalSettings } from '../api/journal.api'
import {
  createSlot,
  deleteSlot,
  generate,
  getClassSchedule,
  listSchedules,
  previewGenerate,
  updateSlot,
} from '../api/teachingSchedule.api'
import GenerateDialog from '../components/GenerateDialog.vue'
import SemesterSwitcher from '../components/SemesterSwitcher.vue'
import SlotDialog from '../components/SlotDialog.vue'
import TimetableGrid from '../components/TimetableGrid.vue'
import { useTeachingOptions } from '../composables/useTeachingOptions'
import { useWorkingSemester } from '../composables/useWorkingSemester'
import { isoDay } from '../utils/timetable'

const can = useCan('teaching_schedules')
const canSettings = useCan('journal_settings')
const notify = useNotify()
const { ask } = useConfirm()

const VIEWS = [
  { value: 'teacher', label: 'Per guru' },
  { value: 'class', label: 'Per kelas' },
]

const { query, update } = useQueryState({
  school_id: { type: 'string' },
  semester: { type: 'string' },
  view: { type: 'string', options: ['teacher', 'class'], default: 'teacher' },
  teacher_id: { type: 'string' },
  class_id: { type: 'string' },
})
const school = useSchoolContext({ query, update })
const semester = useWorkingSemester({ query, update, school })
const options = useTeachingOptions(school, semester)
const teachers = useTeacherOptions(school.scopeId, school.ready)
const scope = () => ({ schoolId: school.scopeId.value, semesterId: semester.id.value })
const view = computed(() => query.value.view || 'teacher')

const settings = ref({ maxPeriod: 12, scheduleMinOccurrences: 2 })
watch(
  () => [school.ready.value, school.scopeId.value],
  async ([ready]) => {
    if (!ready || !canSettings.value.view) return
    settings.value = await getJournalSettings({ schoolId: school.scopeId.value }).catch(
      () => settings.value,
    )
  },
  { immediate: true },
)

const teacherId = computed(
  () => query.value.teacher_id || teachers.teachers.value[0]?.value || null,
)
const classId = computed(() => query.value.class_id || options.classOptions.value[0]?.value || null)

const slots = ref([])
const loading = ref(false)
const loadError = ref(null)
async function load() {
  if (!semester.id.value) return
  const target = view.value === 'teacher' ? teacherId.value : classId.value
  if (!target) {
    slots.value = []
    return
  }
  loading.value = true
  loadError.value = null
  try {
    slots.value =
      view.value === 'teacher'
        ? (await listSchedules({ ...scope(), teacherId: target })).items
        : (await getClassSchedule(target, scope())).slots
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}
watch(
  () => [semester.id.value, view.value, teacherId.value, classId.value, school.scopeId.value],
  load,
  { immediate: true },
)

// ---- Slot ----
const slotDialog = ref({ visible: false, slot: null, initial: null })
function openSlot(slot = null) {
  slotDialog.value = {
    visible: true,
    slot,
    initial: slot
      ? null
      : view.value === 'teacher'
        ? { teacherId: teacherId.value }
        : { classId: classId.value },
  }
}
async function saveSlot(values) {
  if (slotDialog.value.slot) {
    await updateSlot(slotDialog.value.slot.id, values, scope())
    notify.success('Slot jadwal diperbarui')
  } else {
    await createSlot(values, scope())
    notify.success('Slot jadwal ditambahkan')
  }
  await load()
}
async function removeSlot(slot) {
  const ok = await ask({
    header: 'Hapus slot',
    message: `Hapus ${slot.subject?.name} ${slot.class?.name} (${slot.teacher?.name}, ${slot.dayName})?`,
    acceptLabel: 'Hapus',
    danger: true,
  })
  if (!ok) return false
  await deleteSlot(slot.id, scope())
  notify.success('Slot jadwal dihapus')
  await load()
}

const generateVisible = ref(false)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Jadwal Guru"
      description="Jadwal mengajar semua guru, dibentuk dari jurnal dan dikoreksi manual"
    >
      <template v-if="school.ready.value" #actions>
        <Button
          label="Bentuk dari jurnal"
          icon="pi pi-sparkles"
          severity="secondary"
          outlined
          :disabled="!semester.id.value"
          @click="generateVisible = true"
        />
        <Button
          v-if="can.create"
          label="Tambah slot"
          icon="pi pi-plus"
          :disabled="!semester.id.value"
          @click="openSlot()"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <template v-if="school.ready.value">
      <SemesterSwitcher :semester="semester" />
      <Card>
        <template #content>
          <div class="form-stack">
            <div class="toolbar">
              <SelectButton
                :model-value="view"
                :options="VIEWS"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                aria-label="Tampilan"
                @update:model-value="(v) => update({ view: v })"
              />
              <Select
                v-if="view === 'teacher'"
                class="toolbar__filter"
                :model-value="teacherId"
                :options="teachers.teachers.value"
                option-label="label"
                option-value="value"
                placeholder="Pilih guru"
                aria-label="Guru"
                :loading="teachers.loading.value"
                filter
                @update:model-value="(v) => update({ teacher_id: v ?? '' })"
              />
              <Select
                v-else
                class="toolbar__filter"
                :model-value="classId"
                :options="options.classOptions.value"
                option-label="label"
                option-value="value"
                placeholder="Pilih kelas"
                aria-label="Kelas"
                filter
                @update:model-value="(v) => update({ class_id: v ?? '' })"
              />
            </div>
            <EmptyState
              v-if="loadError"
              icon="pi pi-exclamation-circle"
              title="Jadwal tidak dapat dimuat"
              :description="loadError.message"
            />
            <EmptyState
              v-else-if="!loading && !slots.length"
              icon="pi pi-calendar"
              :title="
                view === 'teacher' ? 'Guru ini belum punya jadwal' : 'Kelas ini belum punya jadwal'
              "
              description="Bentuk jadwal dari jurnal guru, atau tambahkan slot secara manual."
            />
            <TimetableGrid
              v-else
              :slots="slots"
              :max-period="Math.min(settings.maxPeriod, 10)"
              :today="isoDay()"
              :show-class="view === 'teacher'"
              :show-teacher="view === 'class'"
              :clickable="can.update || can.delete"
              @select="openSlot"
            />
          </div>
        </template>
      </Card>
    </template>

    <SlotDialog
      v-model:visible="slotDialog.visible"
      :entry="slotDialog.slot"
      :initial="slotDialog.initial"
      :class-options="options.classOptions.value"
      :subject-options="options.subjectOptions.value"
      :teacher-options="teachers.teachers.value"
      :max-period="settings.maxPeriod"
      :can-update="can.update"
      :can-delete="can.delete"
      :submit="saveSlot"
      :remove="removeSlot"
    />
    <GenerateDialog
      v-model:visible="generateVisible"
      :default-min="settings.scheduleMinOccurrences"
      :teacher-options="teachers.teachers.value"
      :can-apply="can.create"
      :preview="(values) => previewGenerate(values, scope())"
      :apply="(values) => generate(values, scope())"
      @applied="load"
    />
  </div>
</template>
