<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { useNotify } from '@/shared/composables/useNotify'
import { PARTICIPANT_STATUSES } from '../constants'

// Ubah satu peserta: tambahan waktu (ikut memperbarui deadline pengerjaan berjalan), tambahan
// kesempatan, status peserta/dikecualikan, catatan.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  participant: { type: Object, default: null },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const values = ref({})
const errors = ref({})
const saving = ref(false)

watch(visible, (open) => {
  if (!open || !props.participant) return
  const p = props.participant
  values.value = {
    extraTimeMinutes: p.extraTimeMinutes,
    extraAttempts: p.extraAttempts,
    status: p.status,
    note: p.note ?? '',
  }
  errors.value = {}
})

async function save() {
  saving.value = true
  errors.value = {}
  try {
    await props.submit(values.value)
    visible.value = false
  } catch (error) {
    errors.value = error.fieldErrors ?? {}
    if (!error.hasFieldErrors) notify.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="participant ? `Peserta: ${participant.name}` : 'Peserta'"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <div class="form-field">
        <label class="form-field__label" for="participant-status">Status</label>
        <SelectButton
          id="participant-status"
          v-model="values.status"
          :options="PARTICIPANT_STATUSES"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <small class="form-field__hint"
          >Siswa yang dikecualikan tidak bisa memulai. Pengerjaan yang sudah ada tetap
          tersimpan.</small
        >
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label class="form-field__label" for="participant-time">Tambahan waktu (menit)</label>
          <InputNumber
            v-model="values.extraTimeMinutes"
            input-id="participant-time"
            :min="0"
            :max="600"
            :invalid="!!errors.extraTimeMinutes"
            fluid
          />
          <small v-if="errors.extraTimeMinutes" class="form-field__error">{{
            errors.extraTimeMinutes
          }}</small>
        </div>
        <div class="form-field">
          <label class="form-field__label" for="participant-attempts">Tambahan kesempatan</label>
          <InputNumber
            v-model="values.extraAttempts"
            input-id="participant-attempts"
            :min="0"
            :max="10"
            :invalid="!!errors.extraAttempts"
            fluid
          />
          <small v-if="errors.extraAttempts" class="form-field__error">{{
            errors.extraAttempts
          }}</small>
        </div>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="participant-note">Catatan</label>
        <Textarea
          id="participant-note"
          v-model="values.note"
          rows="2"
          maxlength="500"
          placeholder="Mis. susulan karena sakit"
          fluid
        />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
