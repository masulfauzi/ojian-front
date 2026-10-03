<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useNotify } from '@/shared/composables/useNotify'
import { downloadBlob, downloadCsv } from '@/shared/utils/download'
import { formatNumber } from '@/shared/utils/format'
import { IMPORT_MAX_BYTES } from '../constants'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** async () => Blob */
  loadTemplate: { type: Function, required: true },
  /** async (file) => laporan impor */
  upload: { type: Function, required: true },
})

const emit = defineEmits(['imported'])

const notify = useNotify()
const file = ref(null)
const fileError = ref('')
const uploading = ref(false)
const downloading = ref(false)
const report = ref(null)
const fileInput = ref()

watch(visible, (open) => {
  if (!open) return
  file.value = null
  fileError.value = ''
  report.value = null
})

function onFileChange(event) {
  const picked = event.target.files?.[0] ?? null
  fileError.value = ''
  if (picked && !/\.xlsx$/i.test(picked.name)) fileError.value = 'File harus berformat .xlsx'
  else if (picked && picked.size > IMPORT_MAX_BYTES) fileError.value = 'Ukuran file maksimal 5 MB'
  file.value = fileError.value ? null : picked
}

async function getTemplate() {
  downloading.value = true
  try {
    downloadBlob(await props.loadTemplate(), 'template-impor-siswa.xlsx')
  } catch (error) {
    notify.error(error)
  } finally {
    downloading.value = false
  }
}

async function runImport() {
  uploading.value = true
  try {
    report.value = await props.upload(file.value)
    emit('imported', report.value)
  } catch (error) {
    notify.error(error)
  } finally {
    uploading.value = false
  }
}

const passwords = computed(() => (report.value?.rows ?? []).filter((r) => r.initialPassword))

const downloadPasswords = () =>
  downloadCsv(
    passwords.value,
    [
      { key: 'row', label: 'Baris' },
      { key: 'name', label: 'Nama' },
      { key: 'nisn', label: 'Username (NISN)' },
      { key: 'initialPassword', label: 'Password awal' },
    ],
    'password-awal-impor-siswa.csv',
  )

const reset = () => {
  report.value = null
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Impor siswa dari Excel"
    :style="{ width: 'min(52rem, calc(100vw - 2rem))' }"
    :closable="!uploading"
    modal
  >
    <div v-if="!report" class="form-stack">
      <ol class="import-steps">
        <li>
          Unduh template, isi satu siswa per baris (NISN, NIS, nama wajib; kolom kelas memakai nama
          kelas pada tahun pelajaran semester aktif; password boleh kosong agar dibuat otomatis).
          <div>
            <Button
              label="Unduh template"
              icon="pi pi-download"
              severity="secondary"
              outlined
              size="small"
              :loading="downloading"
              @click="getTemplate"
            />
          </div>
        </li>
        <li>
          Pilih file .xlsx (maks 5 MB, 2000 baris).
          <div class="import-file">
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx"
              aria-label="File Excel"
              @change="onFileChange"
            />
            <small v-if="fileError" class="form-field__error">{{ fileError }}</small>
          </div>
        </li>
      </ol>
      <Message severity="secondary" :closable="false">
        Setiap baris diproses terpisah: baris yang gagal tidak membatalkan baris lain.
      </Message>
    </div>

    <div v-else class="form-stack">
      <div class="tag-list">
        <Tag :value="`${formatNumber(report.total)} baris`" severity="secondary" />
        <Tag :value="`${formatNumber(report.created)} berhasil`" severity="success" />
        <Tag
          v-if="report.failed"
          :value="`${formatNumber(report.failed)} gagal`"
          severity="danger"
        />
      </div>
      <Message v-if="passwords.length" severity="warn" :closable="false">
        {{ passwords.length }} akun dibuat dengan password otomatis. Password hanya ditampilkan
        sekali — unduh daftarnya sekarang.
      </Message>
      <DataTable :value="report.rows" data-key="row" scrollable scroll-height="22rem" size="small">
        <Column field="row" header="Baris" style="width: 4.5rem" />
        <Column header="Nama">
          <template #body="{ data }">{{ data.name || '-' }}</template>
        </Column>
        <Column header="NISN">
          <template #body="{ data }">{{ data.nisn || '-' }}</template>
        </Column>
        <Column header="Hasil">
          <template #body="{ data }">
            <Tag
              :value="data.status === 'created' ? 'Berhasil' : 'Gagal'"
              :severity="data.status === 'created' ? 'success' : 'danger'"
            />
            <div v-if="data.message" class="text-muted import-message">{{ data.message }}</div>
          </template>
        </Column>
        <Column header="Password awal">
          <template #body="{ data }">
            <code v-if="data.initialPassword">{{ data.initialPassword }}</code>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <template v-if="!report">
          <Button
            label="Batal"
            severity="secondary"
            outlined
            :disabled="uploading"
            @click="visible = false"
          />
          <Button
            label="Unggah dan impor"
            icon="pi pi-upload"
            :loading="uploading"
            :disabled="!file || uploading"
            @click="runImport"
          />
        </template>
        <template v-else>
          <Button label="Impor file lain" severity="secondary" text @click="reset" />
          <Button
            v-if="passwords.length"
            label="Unduh daftar password (CSV)"
            icon="pi pi-download"
            severity="secondary"
            outlined
            @click="downloadPasswords"
          />
          <Button label="Selesai" icon="pi pi-check" @click="visible = false" />
        </template>
      </div>
    </template>
  </Dialog>
</template>
