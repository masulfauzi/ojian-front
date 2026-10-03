<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import { useNotify } from '@/shared/composables/useNotify'
import { formatZonedRange } from '@/shared/utils/zonedTime'
import { listClassOptions } from '@/modules/classroom'
import { setScheduleClasses } from '../api/schedule.api'

// Kelas target jadwal (satu tahun pelajaran dengan semester jadwal). Peserta dibentuk dari
// kelas ini saat jadwal dipublikasikan; setelah itu kelas baru → "Sinkronkan peserta".
const props = defineProps({
  schedule: { type: Object, required: true },
  schoolId: { type: String, default: null },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['saved'])
const notify = useNotify()

const options = ref([])
const selected = ref([])
const warnings = ref([])
const saving = ref(false)

const current = computed(() => props.schedule.classes.map((c) => c.id))
const dirty = computed(
  () => JSON.stringify([...selected.value].sort()) !== JSON.stringify([...current.value].sort()),
)
const classOptions = computed(() =>
  options.value.map((c) => ({ value: c.id, label: c.name, gradeLevel: c.gradeLevel })),
)

watch(
  () => [props.schedule.academicYearId, props.schoolId],
  async ([academicYearId]) => {
    options.value = await listClassOptions({ schoolId: props.schoolId, academicYearId }).catch(
      () => [],
    )
  },
  { immediate: true },
)
watch(current, (ids) => (selected.value = [...ids]), { immediate: true })

async function save() {
  saving.value = true
  try {
    const result = await setScheduleClasses(props.schedule.id, selected.value, {
      schoolId: props.schoolId,
    })
    warnings.value = result.warnings
    notify.success('Kelas target disimpan')
    emit('saved', result.classes)
  } catch (error) {
    notify.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Card>
    <template #title>Kelas target</template>
    <template #content>
      <div class="form-stack">
        <template v-if="editable">
          <MultiSelect
            v-model="selected"
            :options="classOptions"
            option-label="label"
            option-value="value"
            placeholder="Pilih kelas"
            aria-label="Kelas target"
            display="chip"
            filter
            :max-selected-labels="6"
            fluid
          />
          <div class="toolbar">
            <span class="text-muted"> Hanya kelas pada tahun pelajaran semester jadwal. </span>
            <Button
              label="Simpan kelas"
              icon="pi pi-check"
              size="small"
              :disabled="!dirty"
              :loading="saving"
              @click="save"
            />
          </div>
        </template>
        <div v-else class="tag-list">
          <Tag v-for="c in schedule.classes" :key="c.id" :value="c.name" severity="secondary" />
          <span v-if="!schedule.classes.length" class="text-muted">Belum ada kelas target.</span>
        </div>
        <Message v-if="warnings.length" severity="warn" :closable="false">
          Bentrok dengan jadwal lain untuk kelas yang sama:
          <ul class="plain-list">
            <li v-for="w in warnings" :key="w.id">
              <strong>{{ w.title }}</strong> —
              {{ formatZonedRange(w.startsAt, w.endsAt, schedule.timezone) }}
            </li>
          </ul>
        </Message>
      </div>
    </template>
  </Card>
</template>
