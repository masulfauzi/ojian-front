<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import { useNotify } from '@/shared/composables/useNotify'
import { timezoneAbbr } from '@/shared/constants/timezones'
import {
  formatZoned,
  fromZonedInput,
  parseWallClockText,
  toZonedInput,
} from '@/shared/utils/zonedTime'

// Perpanjang waktu tutup jadwal; deadline pengerjaan berjalan dihitung ulang server.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  schedule: { type: Object, required: true },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const value = ref(null)
const error = ref('')
const saving = ref(false)

watch(visible, (open) => {
  if (!open) return
  // Usul awal: +30 menit dari waktu tutup sekarang.
  value.value = toZonedInput(
    Date.parse(props.schedule.endsAt) + 30 * 60000,
    props.schedule.timezone,
  )
  error.value = ''
})

// Ketikan manual diparse sendiri (DatePicker PrimeVue gagal mem-parse jam 24-jam); teks diambil
// dari event input karena saat blur isi input sudah dikembalikan ke nilai lama.
let typedText = null
const onInput = (event) => (typedText = event?.target?.value ?? null)
function onBlur() {
  const typed = parseWallClockText(typedText)
  typedText = null
  if (typed) value.value = typed
}

async function save() {
  const iso = fromZonedInput(value.value, props.schedule.timezone)
  if (!iso || Date.parse(iso) <= Date.parse(props.schedule.endsAt)) {
    error.value = 'Harus setelah waktu tutup saat ini'
    return
  }
  saving.value = true
  try {
    await props.submit(iso)
    visible.value = false
  } catch (err) {
    error.value = err.fieldErrors?.endsAt ?? ''
    if (!error.value) notify.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Perpanjang jadwal"
    :style="{ width: 'min(26rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <p class="text-muted">
        Ditutup saat ini: <strong>{{ formatZoned(schedule.endsAt, schedule.timezone) }}</strong>
      </p>
      <div class="form-field">
        <label class="form-field__label" for="extend-ends"
          >Ditutup baru ({{ timezoneAbbr(schedule.timezone) }})</label
        >
        <DatePicker
          v-model="value"
          input-id="extend-ends"
          date-format="dd/mm/yy"
          hour-format="24"
          show-time
          show-icon
          icon-display="input"
          :invalid="!!error"
          fluid
          @input="onInput"
          @blur="onBlur"
        />
        <small v-if="error" class="form-field__error" role="alert">{{ error }}</small>
        <small v-else class="form-field__hint"
          >Siswa yang sedang mengerjakan dengan batas keras ikut mendapat waktu lebih.</small
        >
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button label="Perpanjang" icon="pi pi-clock" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
