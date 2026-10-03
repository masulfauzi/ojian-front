<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { formatZoned } from '@/shared/utils/zonedTime'

// Konfirmasi mulai ujian (+ token bila jadwal memakai token). Waktu berjalan sejak mulai.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  exam: { type: Object, default: null },
  /** async (token) => void; melempar ApiError. */
  submit: { type: Function, required: true },
})

const token = ref('')
const error = ref('')
const starting = ref(false)

watch(visible, (open) => {
  if (!open) return
  token.value = ''
  error.value = ''
})

async function start() {
  if (props.exam.tokenEnabled && !token.value.trim()) {
    error.value = 'Token wajib diisi'
    return
  }
  starting.value = true
  error.value = ''
  try {
    await props.submit(token.value)
  } catch (err) {
    error.value =
      err.fieldErrors?.token ??
      (err.status === 429
        ? 'Terlalu banyak percobaan token salah. Tunggu satu menit.'
        : err.message)
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="exam?.title ?? 'Mulai ujian'"
    :style="{ width: 'min(26rem, calc(100vw - 2rem))' }"
    modal
  >
    <form v-if="exam" class="form-stack" novalidate @submit.prevent="start">
      <dl class="detail-list">
        <dt>Mapel</dt>
        <dd>{{ exam.subjectName ?? '-' }}</dd>
        <dt>Durasi</dt>
        <dd>{{ exam.durationMinutes }} menit</dd>
        <dt>Ditutup</dt>
        <dd>{{ formatZoned(exam.endsAt, exam.timezone) }}</dd>
      </dl>
      <Message severity="info" :closable="false">
        Waktu mulai berjalan saat Anda menekan <strong>Mulai</strong> dan tidak berhenti walau
        halaman ditutup. Jawaban tersimpan otomatis.
      </Message>
      <div v-if="exam.tokenEnabled" class="form-field">
        <label class="form-field__label" for="exam-token">Token dari pengawas</label>
        <InputText
          id="exam-token"
          v-model="token"
          class="token-input"
          maxlength="20"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          :invalid="!!error"
          autofocus
          fluid
        />
        <small v-if="error" class="form-field__error" role="alert">{{ error }}</small>
      </div>
      <small v-else-if="error" class="form-field__error" role="alert">{{ error }}</small>
      <button type="submit" hidden />
    </form>
    <template #footer>
      <div class="dialog-footer">
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button label="Mulai" icon="pi pi-play" :loading="starting" @click="start" />
      </div>
    </template>
  </Dialog>
</template>
