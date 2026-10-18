<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDate } from '@/shared/utils/format'
import { REASON_LABELS, periodLabel } from '../utils/timetable'

/**
 * Bentuk jadwal dari pola jurnal: pratinjau (tanpa menyimpan) lalu terapkan. Slot manual dan
 * terkunci dipertahankan; slot hasil generate lain diganti.
 */
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  /** Ambang bawaan (journal_settings.schedule_min_occurrences). */
  defaultMin: { type: Number, default: 2 },
  /** Admin: pilihan guru (kosong = semua guru yang punya jurnal); null = jadwal sendiri. */
  teacherOptions: { type: Array, default: null },
  canApply: { type: Boolean, default: true },
  /** async ({ minOccurrences, teacherIds }) → PreviewResponse */
  preview: { type: Function, required: true },
  /** async ({ minOccurrences, teacherIds }) → GenerateResponse */
  apply: { type: Function, required: true },
})
const emit = defineEmits(['applied'])
const notify = useNotify()

const minOccurrences = ref(2)
const teacherIds = ref([])
const result = ref(null)
const loading = ref(false)
const applying = ref(false)

const params = computed(() => ({
  minOccurrences: minOccurrences.value,
  teacherIds: teacherIds.value,
}))

async function runPreview() {
  loading.value = true
  try {
    result.value = await props.preview(params.value)
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}

watch(visible, (open) => {
  if (!open) return
  minOccurrences.value = props.defaultMin
  teacherIds.value = []
  result.value = null
  runPreview()
})

async function runApply() {
  applying.value = true
  try {
    const summary = await props.apply(params.value)
    notify.success(
      `Jadwal dibentuk: ${summary.created} slot baru, ${summary.removed} slot lama diganti` +
        (summary.rejectedConflict ? `, ${summary.rejectedConflict} pola bentrok dilewati` : ''),
    )
    visible.value = false
    emit('applied', summary)
  } catch (error) {
    notify.error(error)
  } finally {
    applying.value = false
  }
}

const range = (c) =>
  `${formatDate(c.firstDate, { day: 'numeric', month: 'short' })}–${formatDate(c.lastDate, { day: 'numeric', month: 'short' })}`
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Bentuk jadwal dari jurnal"
    :style="{ width: 'min(52rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <p class="text-muted">
        Pola jurnal yang berulang (hari dan jam ke yang sama untuk kelas dan mapel yang sama)
        menjadi slot jadwal. Slot manual dan slot terkunci tidak diubah.
      </p>
      <div class="toolbar">
        <div class="form-field">
          <label class="form-field__label" for="gen-min">Minimal muncul</label>
          <InputNumber
            v-model="minOccurrences"
            input-id="gen-min"
            :min="1"
            :max="20"
            show-buttons
            suffix=" kali"
          />
        </div>
        <div v-if="teacherOptions" class="form-field generate-teachers">
          <label class="form-field__label" for="gen-teachers">Guru</label>
          <MultiSelect
            v-model="teacherIds"
            input-id="gen-teachers"
            :options="teacherOptions"
            option-label="label"
            option-value="value"
            placeholder="Semua guru yang punya jurnal"
            display="chip"
            filter
            fluid
          />
        </div>
        <Button
          label="Pratinjau"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="runPreview"
        />
      </div>

      <template v-if="result">
        <h3 class="form-section-title">
          Akan dibuat <Tag :value="`${result.accepted.length} slot`" severity="success" />
        </h3>
        <DataTable :value="result.accepted" size="small" striped-rows>
          <template #empty>
            <EmptyState
              icon="pi pi-calendar"
              title="Belum ada pola yang cukup sering"
              description="Isi jurnal beberapa pekan atau turunkan batas minimal muncul."
            />
          </template>
          <Column v-if="teacherOptions" field="teacherName" header="Guru" />
          <Column header="Hari & jam">
            <template #body="{ data }"
              >{{ data.dayName }} · jam {{ periodLabel(data.periodFrom, data.periodTo) }}</template
            >
          </Column>
          <Column field="className" header="Kelas" />
          <Column field="subjectName" header="Mapel" />
          <Column header="Muncul">
            <template #body="{ data }">
              {{ data.occurrences }}× <span class="text-muted">({{ range(data) }})</span>
            </template>
          </Column>
        </DataTable>

        <template v-if="result.rejected.length">
          <h3 class="form-section-title">
            Dilewati <Tag :value="`${result.rejected.length} pola`" severity="secondary" />
          </h3>
          <DataTable :value="result.rejected" size="small" striped-rows>
            <Column v-if="teacherOptions" field="teacherName" header="Guru" />
            <Column header="Hari & jam">
              <template #body="{ data }"
                >{{ data.dayName }} · jam
                {{ periodLabel(data.periodFrom, data.periodTo) }}</template
              >
            </Column>
            <Column field="className" header="Kelas" />
            <Column field="subjectName" header="Mapel" />
            <Column header="Muncul">
              <template #body="{ data }">{{ data.occurrences }}×</template>
            </Column>
            <Column header="Alasan">
              <template #body="{ data }">
                <Tag :value="REASON_LABELS[data.reason] ?? data.reason" severity="warn" />
                <div v-if="data.conflictWith" class="text-muted">
                  dengan {{ data.conflictWith.className || 'slot' }} jam
                  {{ periodLabel(data.conflictWith.periodFrom, data.conflictWith.periodTo) }}
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
        <Message v-if="!canApply" severity="secondary" :closable="false">
          Anda hanya dapat melihat pratinjau.
        </Message>
      </template>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button
          v-if="canApply"
          label="Terapkan"
          icon="pi pi-check"
          :disabled="!result || loading"
          :loading="applying"
          @click="runApply"
        />
      </div>
    </template>
  </Dialog>
</template>
