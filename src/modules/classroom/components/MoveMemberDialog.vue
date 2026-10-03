<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { useNotify } from '@/shared/composables/useNotify'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  student: { type: Object, default: null },
  /** Kelas lain di tahun pelajaran yang sama [{ id, name }]. */
  classes: { type: Array, default: () => [] },
  /** async (targetClassId) => void */
  submit: { type: Function, required: true },
})

const notify = useNotify()
const target = ref(null)
const saving = ref(false)

watch(visible, (open) => {
  if (open) target.value = null
})

async function save() {
  saving.value = true
  try {
    await props.submit(target.value)
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
    :header="`Pindahkan ${student?.name ?? ''}`"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    :closable="!saving"
    modal
  >
    <div class="form-field">
      <label for="move-target" class="form-field__label">Kelas tujuan</label>
      <Select
        v-model="target"
        input-id="move-target"
        :options="classes"
        option-label="name"
        option-value="id"
        placeholder="Pilih kelas"
        filter
        fluid
      />
      <small class="form-field__hint">Hanya kelas pada tahun pelajaran yang sama.</small>
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
          label="Pindahkan"
          icon="pi pi-arrow-right-arrow-left"
          :loading="saving"
          :disabled="!target || saving"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
