<script setup>
import { computed, ref, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressBar from 'primevue/progressbar'
import SelectButton from 'primevue/selectbutton'
import FormDatePicker from '@/shared/components/form/FormDatePicker.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { addDays } from '@/shared/utils/date'
import { LEAVE_FILE_ACCEPT, LEAVE_TYPES, MAX_LEAVE_FILES } from '../constants'
import { leaveSchema } from '../schemas/attendance.schema'
import { leaveErrorField } from '../utils/errors'
import { fileProblem, fileSize, isPdf } from '../utils/files'

/**
 * Ajukan izin/sakit: bukti diunggah satu per satu lewat `upload(file, { onProgress })` begitu dipilih
 * (POST /media purpose=leave_proof), lalu `submit(values)` mengirim id berkasnya.
 */
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  /** Tanggal hari ini menurut sekolah ('YYYY-MM-DD'). */
  today: { type: String, required: true },
  submit: { type: Function, required: true },
  upload: { type: Function, required: true },
})
const notify = useNotify()

const form = useForm({ validationSchema: toTypedSchema(leaveSchema) })
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: leaveErrorField, 422: leaveErrorField },
})
const { value: leaveType, errorMessage: typeError } = useField('leaveType')
const { errorMessage: mediaError, setValue: setMediaIds } = useField('mediaIds')

/** [{ key, name, size, mime, progress, mediaId?, error? }] */
const files = ref([])
const fileInput = ref(null)
let seq = 0

const uploading = computed(() => files.value.some((f) => !f.mediaId && !f.error))
const canAdd = computed(() => files.value.filter((f) => !f.error).length < MAX_LEAVE_FILES)

watch(visible, (open) => {
  if (!open) return
  files.value = []
  form.resetForm({
    values: {
      leaveType: 'sick',
      startDate: props.today,
      endDate: props.today,
      reason: '',
      mediaIds: [],
    },
  })
})

const syncMediaIds = () =>
  setMediaIds(
    files.value.filter((f) => f.mediaId).map((f) => f.mediaId),
    false,
  )

async function addFiles(event) {
  const picked = [...(event.target.files ?? [])]
  event.target.value = ''
  for (const file of picked) {
    if (!canAdd.value) {
      notify.warn(`Maksimal ${MAX_LEAVE_FILES} berkas bukti.`)
      break
    }
    const entry = { key: ++seq, name: file.name, size: file.size, mime: file.type, progress: 0 }
    const problem = fileProblem(file)
    if (problem) {
      notify.error(`${file.name}: ${problem}`)
      continue
    }
    files.value.push(entry)
    const item = files.value[files.value.length - 1]
    try {
      const media = await props.upload(file, {
        onProgress: (p) => (item.progress = p ?? item.progress),
      })
      item.mediaId = media.id
      item.progress = 100
      syncMediaIds()
    } catch (error) {
      item.error = error.message
    }
  }
}

function removeFile(key) {
  files.value = files.value.filter((f) => f.key !== key)
  syncMediaIds()
}

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await props.submit(values)
    visible.value = false
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})

const maxStart = computed(() => addDays(props.today, 60))
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Ajukan izin atau sakit"
    :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="leave-form" class="form-stack" novalidate @submit="onSubmit">
      <div class="form-field">
        <span class="form-field__label">Jenis</span>
        <SelectButton
          v-model="leaveType"
          :options="LEAVE_TYPES"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Jenis izin"
        />
        <small v-if="typeError" class="form-field__error">{{ typeError }}</small>
      </div>
      <div class="form-grid">
        <FormDatePicker name="startDate" label="Mulai" :max-date="maxStart" required />
        <FormDatePicker
          name="endDate"
          label="Sampai"
          :min-date="form.values.startDate || undefined"
          :max-date="maxStart"
          required
        />
      </div>
      <FormTextarea
        name="reason"
        label="Alasan"
        :rows="3"
        placeholder="Mis. demam, sesuai surat dokter terlampir."
        required
      />

      <div class="form-field">
        <span class="form-field__label">Bukti (foto atau PDF, maks {{ MAX_LEAVE_FILES }})</span>
        <ul v-if="files.length" class="plain-list leave-upload-list">
          <li
            v-for="file in files"
            :key="file.key"
            class="leave-upload"
            :class="{ 'is-error': file.error }"
          >
            <i :class="isPdf(file.mime) ? 'pi pi-file-pdf' : 'pi pi-image'" aria-hidden="true" />
            <div class="leave-upload__body">
              <span class="leave-upload__name">{{ file.name }}</span>
              <small class="text-muted">{{ fileSize(file.size) }}</small>
              <ProgressBar
                v-if="!file.mediaId && !file.error"
                :value="file.progress"
                :show-value="false"
                class="leave-upload__bar"
              />
              <small v-if="file.error" class="form-field__error">{{ file.error }}</small>
            </div>
            <Button
              icon="pi pi-times"
              severity="secondary"
              text
              rounded
              size="small"
              :aria-label="`Hapus ${file.name}`"
              @click="removeFile(file.key)"
            />
          </li>
        </ul>
        <div>
          <Button
            label="Tambah bukti"
            icon="pi pi-paperclip"
            size="small"
            severity="secondary"
            outlined
            :disabled="!canAdd"
            @click="fileInput.click()"
          />
        </div>
        <input
          ref="fileInput"
          type="file"
          :accept="LEAVE_FILE_ACCEPT"
          multiple
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          @change="addFiles"
        />
        <small v-if="mediaError" class="form-field__error" role="alert">{{ mediaError }}</small>
        <small v-else class="form-field__hint"
          >Contoh: surat dokter atau surat dari orang tua.</small
        >
      </div>
    </form>
    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          :disabled="form.isSubmitting.value"
          @click="visible = false"
        />
        <Button
          type="submit"
          form="leave-form"
          label="Ajukan"
          icon="pi pi-send"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value || uploading"
        />
      </div>
    </template>
  </Dialog>
</template>
