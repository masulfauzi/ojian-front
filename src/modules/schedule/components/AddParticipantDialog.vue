<script setup>
import { ref, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useNotify } from '@/shared/composables/useNotify'
import { listStudentOptions } from '@/modules/student'

// Tambah peserta manual (susulan, pindahan): siswa aktif mana pun di sekolah.
const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
  schoolId: { type: String, default: null },
  submit: { type: Function, required: true },
})
const notify = useNotify()

const student = ref(null)
const suggestions = ref([])
const note = ref('')
const saving = ref(false)

watch(visible, (open) => {
  if (!open) return
  student.value = null
  note.value = ''
})

async function search(event) {
  try {
    suggestions.value = await listStudentOptions({ schoolId: props.schoolId, search: event.query })
  } catch (error) {
    suggestions.value = []
    notify.error(error)
  }
}

const label = (s) => `${s.name} — ${s.nis}${s.class ? ` (${s.class.name})` : ''}`

async function save() {
  if (!student.value?.id) return
  saving.value = true
  try {
    await props.submit({ studentId: student.value.id, note: note.value.trim() })
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
    header="Tambah peserta"
    :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
    modal
  >
    <div class="form-stack">
      <div class="form-field">
        <label class="form-field__label" for="add-participant">Siswa</label>
        <AutoComplete
          v-model="student"
          input-id="add-participant"
          :suggestions="suggestions"
          :option-label="label"
          placeholder="Ketik nama, NIS, atau NISN"
          :delay="300"
          force-selection
          fluid
          @complete="search"
        />
        <small class="form-field__hint"
          >Peserta yang pernah dikecualikan akan diaktifkan kembali.</small
        >
      </div>
      <div class="form-field">
        <label class="form-field__label" for="add-participant-note">Catatan</label>
        <InputText
          id="add-participant-note"
          v-model="note"
          maxlength="500"
          placeholder="Mis. ujian susulan"
          fluid
        />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button label="Batal" severity="secondary" outlined @click="visible = false" />
        <Button
          label="Tambah"
          icon="pi pi-plus"
          :disabled="!student?.id"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
