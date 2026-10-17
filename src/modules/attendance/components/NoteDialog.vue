<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import { useNotify } from '@/shared/composables/useNotify'

// Konfirmasi dengan catatan/alasan (tolak izin, batalkan persetujuan, hapus presensi).
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  header: { type: String, required: true },
  message: { type: String, default: '' },
  label: { type: String, default: 'Catatan' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: true },
  confirmLabel: { type: String, default: 'Simpan' },
  confirmIcon: { type: String, default: 'pi pi-check' },
  danger: { type: Boolean, default: false },
  /** async (note) → void; melempar ApiError. */
  submit: { type: Function, required: true },
  /** Nama field error backend untuk catatan (mis. 'note' atau 'reason'). */
  field: { type: String, default: 'note' },
})
const notify = useNotify()

const note = ref('')
const error = ref('')
const saving = ref(false)

watch(visible, (open) => {
  if (!open) return
  note.value = ''
  error.value = ''
})

async function save() {
  const text = note.value.trim()
  if (props.required && text.length < 3) {
    error.value = 'Wajib diisi, minimal 3 karakter'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await props.submit(text)
    visible.value = false
  } catch (err) {
    error.value = err.fieldErrors?.[props.field] ?? ''
    if (!error.value) notify.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="header"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    :closable="!saving"
    modal
  >
    <div class="form-stack">
      <p v-if="message" class="text-muted">{{ message }}</p>
      <div class="form-field">
        <label class="form-field__label" for="note-dialog-text">
          {{ label }}<span v-if="required" class="form-field__required" aria-hidden="true">*</span>
        </label>
        <Textarea
          id="note-dialog-text"
          v-model="note"
          rows="3"
          maxlength="1000"
          :placeholder="placeholder"
          :invalid="!!error"
          autofocus
          fluid
        />
        <small v-if="error" class="form-field__error" role="alert">{{ error }}</small>
      </div>
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
          :label="confirmLabel"
          :icon="confirmIcon"
          :severity="danger ? 'danger' : undefined"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
