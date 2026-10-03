<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useDebounceFn } from '@/shared/composables/useDebounce'
import { useNotify } from '@/shared/composables/useNotify'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  className: { type: String, default: '' },
  semesterLabel: { type: String, default: '' },
  /** async (search) => { items, total } — siswa aktif yang belum punya kelas di semester ini. */
  load: { type: Function, required: true },
  /** async (studentIds) => void */
  submit: { type: Function, required: true },
})

const notify = useNotify()
const students = ref([])
const total = ref(0)
const selected = ref([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)

async function fetchStudents() {
  loading.value = true
  try {
    const result = await props.load(search.value.trim())
    students.value = result.items
    total.value = result.total
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}

const onSearch = useDebounceFn(fetchStudents, 300)
watch(search, onSearch)

watch(visible, (open) => {
  if (!open) return
  selected.value = []
  search.value = ''
  fetchStudents()
})

async function save() {
  saving.value = true
  try {
    await props.submit(selected.value.map((s) => s.id))
    visible.value = false
  } catch (error) {
    notify.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="`Tambah siswa ke ${className}`"
    :style="{ width: 'min(44rem, calc(100vw - 2rem))' }"
    :closable="!saving"
    modal
  >
    <div class="form-stack">
      <p class="text-muted" style="margin: 0">
        Siswa aktif yang belum punya kelas pada semester {{ semesterLabel }}.
      </p>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="search"
          placeholder="Cari nama, NIS, atau NISN"
          aria-label="Cari siswa"
          fluid
        />
      </IconField>
      <Message v-if="total > students.length" severity="secondary" :closable="false">
        Menampilkan {{ students.length }} dari {{ total }} siswa. Persempit dengan pencarian.
      </Message>
      <DataTable
        v-model:selection="selected"
        :value="students"
        :loading="loading"
        data-key="id"
        scrollable
        scroll-height="22rem"
        size="small"
      >
        <template #empty>
          <EmptyState
            icon="pi pi-users"
            title="Tidak ada siswa"
            description="Semua siswa aktif sudah punya kelas pada semester ini."
          />
        </template>
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="name" header="Nama" />
        <Column field="nis" header="NIS" />
        <Column field="nisn" header="NISN" />
      </DataTable>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          :disabled="saving"
          @click="visible = false"
        />
        <Button
          :label="selected.length ? `Tambahkan ${selected.length} siswa` : 'Tambahkan'"
          icon="pi pi-check"
          :loading="saving"
          :disabled="!selected.length || saving"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
