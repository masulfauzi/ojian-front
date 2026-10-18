<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { useNotify } from '@/shared/composables/useNotify'
import { downloadBlob } from '@/shared/utils/download'
import { fromISODate, toISODate } from '@/shared/utils/date'

// Unduh jurnal sebagai Excel (.xlsx). Rentang opsional (harus di dalam semester).
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  semester: { type: Object, default: null },
  /** Admin: pilihan guru (null = semua guru). Guru: tidak diisi. */
  teacherOptions: { type: Array, default: null },
  /** async ({ from, to, includeAttendance, teacherId }) → { blob, filename } */
  download: { type: Function, required: true },
})
const notify = useNotify()

const range = ref(null)
const includeAttendance = ref(true)
const teacherId = ref(null)
const busy = ref(false)

watch(visible, (open) => {
  if (!open) return
  range.value = null
  includeAttendance.value = true
  teacherId.value = null
})

async function run() {
  busy.value = true
  try {
    const [from, to] = range.value ?? []
    const { blob, filename } = await props.download({
      from: toISODate(from) ?? undefined,
      to: toISODate(to ?? from) ?? undefined,
      includeAttendance: includeAttendance.value,
      teacherId: teacherId.value ?? undefined,
    })
    downloadBlob(blob, filename)
    notify.success(`Berkas ${filename} diunduh`)
    visible.value = false
  } catch (error) {
    notify.error(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Unduh jurnal (Excel)"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <p class="text-muted">
        Laporan siap cetak: jurnal, total jam pelajaran, rekap per kelas/mapel, dan kolom tanda
        tangan.
      </p>
      <div v-if="teacherOptions" class="form-field">
        <label class="form-field__label" for="export-teacher">Guru</label>
        <Select
          v-model="teacherId"
          input-id="export-teacher"
          :options="teacherOptions"
          option-label="label"
          option-value="value"
          placeholder="Semua guru"
          show-clear
          filter
          fluid
        />
      </div>
      <div class="form-field">
        <label class="form-field__label" for="export-range">Rentang tanggal</label>
        <DatePicker
          v-model="range"
          input-id="export-range"
          selection-mode="range"
          date-format="dd/mm/yy"
          :min-date="fromISODate(semester?.startDate) ?? undefined"
          :max-date="fromISODate(semester?.endDate) ?? undefined"
          placeholder="Seluruh semester"
          show-icon
          icon-display="input"
          show-button-bar
          fluid
        />
        <small class="form-field__hint">Kosongkan untuk seluruh semester.</small>
      </div>
      <label class="form-switch">
        <Checkbox v-model="includeAttendance" binary />
        Sertakan rekap kehadiran siswa (H/T/I/S/A)
      </label>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          :disabled="busy"
          @click="visible = false"
        />
        <Button label="Unduh" icon="pi pi-download" :loading="busy" @click="run" />
      </div>
    </template>
  </Dialog>
</template>
