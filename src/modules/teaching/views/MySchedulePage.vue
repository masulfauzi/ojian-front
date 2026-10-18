<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useCan } from '@/modules/auth'
import { useSchoolContext } from '@/modules/academic'
import {
  createMySlot,
  deleteMySlot,
  generateMy,
  listMySchedule,
  previewMyGenerate,
  updateMySlot,
} from '../api/teachingSchedule.api'
import GenerateDialog from '../components/GenerateDialog.vue'
import SemesterSwitcher from '../components/SemesterSwitcher.vue'
import SlotDialog from '../components/SlotDialog.vue'
import TimetableGrid from '../components/TimetableGrid.vue'
import { useTeachingOptions } from '../composables/useTeachingOptions'
import { useWorkingSemester } from '../composables/useWorkingSemester'
import { isoDay } from '../utils/timetable'

// Batas jam bawaan backend; guru tidak berhak membaca pengaturan jurnal (server tetap memvalidasi).
const MAX_PERIOD = 12

const can = useCan('my_schedule')
const notify = useNotify()
const { ask } = useConfirm()

const { query, update } = useQueryState({ semester: { type: 'string' } })
const school = useSchoolContext({ query, update })
const semester = useWorkingSemester({ query, update, school })
const options = useTeachingOptions(school, semester)

const slots = ref([])
const loading = ref(false)
const loadError = ref(null)
const today = isoDay()

async function load() {
  if (!semester.id.value) return
  loading.value = true
  loadError.value = null
  try {
    slots.value = (await listMySchedule({ semesterId: semester.id.value })).items
  } catch (error) {
    loadError.value = error
  } finally {
    loading.value = false
  }
}
watch(() => semester.id.value, load, { immediate: true })

const scope = () => ({ semesterId: semester.id.value })

// ---- Slot ----
const slotDialog = ref({ visible: false, slot: null })
const openSlot = (slot = null) => (slotDialog.value = { visible: true, slot })

async function saveSlot(values) {
  if (slotDialog.value.slot) {
    await updateMySlot(slotDialog.value.slot.id, values)
    notify.success('Slot jadwal diperbarui')
  } else {
    await createMySlot(values, scope())
    notify.success('Slot jadwal ditambahkan')
  }
  await load()
}

/** false = dibatalkan pengguna (dialog slot tetap terbuka). */
async function removeSlot(slot) {
  const ok = await ask({
    header: 'Hapus slot',
    message: `Hapus ${slot.subject?.name} ${slot.class?.name} (${slot.dayName})?`,
    acceptLabel: 'Hapus',
    danger: true,
  })
  if (!ok) return false
  await deleteMySlot(slot.id)
  notify.success('Slot jadwal dihapus')
  await load()
}

const generateVisible = ref(false)
</script>

<template>
  <div class="page">
    <PageHeader
      title="Jadwal Mengajar"
      description="Jadwal mingguan Anda, dibentuk dari pola jurnal dan bisa dikoreksi manual"
    >
      <template #actions>
        <Button
          v-if="can.create"
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

    <SemesterSwitcher :semester="semester" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Jadwal tidak dapat dimuat"
      :description="loadError.message"
    />
    <Card v-else>
      <template #content>
        <EmptyState
          v-if="!loading && !slots.length"
          icon="pi pi-calendar"
          title="Belum ada jadwal"
          description='Isi jurnal mengajar beberapa pekan, lalu tekan "Bentuk dari jurnal". Atau tambahkan slot secara manual.'
        >
          <Button
            v-if="can.create && semester.id.value"
            label="Bentuk dari jurnal"
            icon="pi pi-sparkles"
            @click="generateVisible = true"
          />
        </EmptyState>
        <template v-else>
          <TimetableGrid
            :slots="slots"
            :max-period="8"
            :today="today"
            :clickable="can.update || can.delete"
            @select="openSlot"
          />
          <p class="text-muted timetable-legend">
            <i class="pi pi-pencil" aria-hidden="true" /> manual ·
            <i class="pi pi-lock" aria-hidden="true" /> terkunci (dipertahankan saat dibentuk ulang)
            · lainnya dibentuk dari jurnal.
          </p>
        </template>
      </template>
    </Card>

    <SlotDialog
      v-model:visible="slotDialog.visible"
      :entry="slotDialog.slot"
      :class-options="options.classOptions.value"
      :subject-options="options.subjectOptions.value"
      :max-period="MAX_PERIOD"
      :can-update="can.update"
      :can-delete="can.delete"
      :submit="saveSlot"
      :remove="removeSlot"
    />
    <GenerateDialog
      v-model:visible="generateVisible"
      :can-apply="can.create"
      :preview="(values) => previewMyGenerate(values, scope())"
      :apply="(values) => generateMy(values, scope())"
      @applied="load"
    />
  </div>
</template>
