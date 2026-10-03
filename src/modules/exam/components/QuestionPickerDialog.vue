<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useDebounceFn } from '@/shared/composables/useDebounce'
import { useNotify } from '@/shared/composables/useNotify'
import { QUESTION_TYPES, difficultyOf, listQuestions, typeLabel } from '@/modules/questionbank'

const PAGE_SIZE = 10

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  schoolId: { type: String, default: null },
  /** Mapel paket (filter awal). */
  subjectId: { type: String, default: null },
  subjects: { type: Array, default: () => [] },
  /** ID soal bank yang sudah ada di paket. */
  usedIds: { type: Array, default: () => [] },
  /** [{ no, title }] — bagian tujuan. */
  sections: { type: Array, default: () => [] },
  defaultSection: { type: Number, default: 1 },
  /** Sisa slot (maks 300 soal per paket). */
  remaining: { type: Number, default: 300 },
})

const emit = defineEmits(['pick'])
const notify = useNotify()

const filters = ref({ search: '', subjectId: null, typeCode: null, page: 1 })
const searchInput = ref('')
const items = ref([])
const total = ref(0)
const loading = ref(false)
const selected = ref([])
const sectionNo = ref(1)
let seq = 0

const used = computed(() => new Set(props.usedIds))
const typeOptions = Object.entries(QUESTION_TYPES).map(([value, t]) => ({ value, label: t.label }))
const subjectOptions = computed(() => props.subjects.map((s) => ({ value: s.id, label: s.name })))
const sectionOptions = computed(() =>
  props.sections.map((s) => ({
    value: s.no,
    label: s.title ? `${s.no}. ${s.title}` : `Bagian ${s.no}`,
  })),
)

async function load() {
  const current = ++seq
  loading.value = true
  try {
    const result = await listQuestions({
      schoolId: props.schoolId,
      status: 'active',
      page: filters.value.page,
      limit: PAGE_SIZE,
      search: filters.value.search,
      subjectId: filters.value.subjectId,
      typeCode: filters.value.typeCode,
    })
    if (current !== seq) return
    items.value = result.items
    total.value = result.meta.total
  } catch (error) {
    if (current === seq) notify.error(error)
  } finally {
    if (current === seq) loading.value = false
  }
}

watch(visible, (open) => {
  if (!open) return
  selected.value = []
  searchInput.value = ''
  sectionNo.value = props.defaultSection
  filters.value = { search: '', subjectId: props.subjectId, typeCode: null, page: 1 }
})
watch(filters, () => visible.value && load(), { deep: true })

const applySearch = useDebounceFn((value) => {
  filters.value = { ...filters.value, search: value.trim(), page: 1 }
}, 300)
watch(searchInput, applySearch)

const setFilter = (patch) => (filters.value = { ...filters.value, ...patch, page: 1 })

const isUsed = (item) => used.value.has(item.id)
const tooMany = computed(() => selected.value.length > props.remaining)

function confirm() {
  emit('pick', { questions: selected.value, sectionNo: sectionNo.value })
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Pilih soal dari bank soal"
    :style="{ width: 'min(60rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <p class="text-muted">
        Hanya soal berstatus <strong>Aktif</strong> yang bisa dimasukkan. Versi soal saat ini yang
        dipakai; bila soal diubah nanti, paket tetap memakai versi ini.
      </p>
      <div class="toolbar">
        <IconField class="toolbar__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="searchInput" placeholder="Cari soal" aria-label="Cari soal" fluid />
        </IconField>
        <Select
          class="toolbar__filter"
          :model-value="filters.subjectId"
          :options="subjectOptions"
          option-label="label"
          option-value="value"
          placeholder="Semua mapel"
          aria-label="Filter mata pelajaran"
          show-clear
          @update:model-value="(v) => setFilter({ subjectId: v ?? null })"
        />
        <Select
          class="toolbar__filter"
          :model-value="filters.typeCode"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="Semua jenis"
          aria-label="Filter jenis soal"
          show-clear
          @update:model-value="(v) => setFilter({ typeCode: v ?? null })"
        />
      </div>
      <DataTable
        v-model:selection="selected"
        :value="items"
        :loading="loading"
        :total-records="total"
        :rows="PAGE_SIZE"
        :first="(filters.page - 1) * PAGE_SIZE"
        :row-class="(row) => (isUsed(row) ? 'row-muted' : '')"
        :is-data-selectable="({ data }) => !isUsed(data)"
        data-key="id"
        lazy
        paginator
        paginator-template="PrevPageLink PageLinks NextPageLink CurrentPageReport"
        current-page-report-template="{totalRecords} soal aktif"
        size="small"
        @page="(event) => (filters = { ...filters, page: event.page + 1 })"
      >
        <template #empty>
          <EmptyState
            icon="pi pi-database"
            title="Tidak ada soal aktif"
            description="Aktifkan soal di Bank Soal agar bisa dipilih."
          />
        </template>
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column header="Soal">
          <template #body="{ data }">
            <span class="question-cell__text">{{ data.preview || '(tanpa teks)' }}</span>
            <Tag v-if="isUsed(data)" value="Sudah di paket" severity="secondary" />
          </template>
        </Column>
        <Column header="Jenis">
          <template #body="{ data }">{{ typeLabel(data.typeCode) }}</template>
        </Column>
        <Column header="Mapel">
          <template #body="{ data }">
            {{ data.subjectName ?? '-' }}
            <span v-if="data.gradeLevel" class="text-muted"> · {{ data.gradeLevel }}</span>
          </template>
        </Column>
        <Column header="Kesulitan">
          <template #body="{ data }">{{ difficultyOf(data.difficulty)?.label ?? '-' }}</template>
        </Column>
        <Column header="Bobot">
          <template #body="{ data }">{{ data.defaultPoints }}</template>
        </Column>
      </DataTable>
    </div>
    <template #footer>
      <div class="dialog-footer picker-footer">
        <span class="text-muted">
          {{ selected.length }} dipilih
          <span v-if="tooMany" class="text-danger"> · maksimal {{ remaining }} soal lagi</span>
        </span>
        <Select
          v-if="sectionOptions.length > 1"
          v-model="sectionNo"
          :options="sectionOptions"
          option-label="label"
          option-value="value"
          aria-label="Masukkan ke bagian"
        />
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button
          :label="`Tambahkan ${selected.length || ''} soal`"
          icon="pi pi-plus"
          :disabled="!selected.length || tooMany"
          @click="confirm"
        />
      </div>
    </template>
  </Dialog>
</template>
