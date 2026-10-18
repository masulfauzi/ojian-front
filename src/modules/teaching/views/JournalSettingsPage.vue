<script setup>
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useQueryState } from '@/shared/composables/useQueryState'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { useCan } from '@/modules/auth'
import { SchoolContextBar, useSchoolContext } from '@/modules/academic'
import { getJournalSettings, updateJournalSettings } from '../api/journal.api'
import { journalSettingsSchema } from '../schemas/teaching.schema'

const can = useCan('journal_settings')
const notify = useNotify()

const { query, update } = useQueryState({ school_id: { type: 'string' } })
const school = useSchoolContext({ query, update })
const scope = () => ({ schoolId: school.scopeId.value })
const readonly = computed(() => !can.value.update)

const settings = ref(null)
const loadError = ref(null)
const form = useForm({ validationSchema: toTypedSchema(journalSettingsSchema) })
const applyServerErrors = useServerErrors(form)

async function load() {
  loadError.value = null
  settings.value = null
  try {
    settings.value = await getJournalSettings(scope())
    form.resetForm({ values: { ...settings.value } })
  } catch (error) {
    loadError.value = error
  }
}
watch(
  () => [school.ready.value, school.scopeId.value],
  ([ready]) => ready && load(),
  { immediate: true },
)

const onSubmit = form.handleSubmit(async (values) => {
  try {
    settings.value = await updateJournalSettings(values, scope())
    form.resetForm({ values: { ...settings.value } })
    notify.success('Pengaturan jurnal disimpan')
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="Pengaturan Jurnal"
      description="Jam pelajaran, batas waktu ubah jurnal, pembentukan jadwal, dan tanda tangan laporan"
    >
      <template v-if="settings && !readonly" #actions>
        <Button
          type="submit"
          form="journal-settings"
          label="Simpan"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="!form.meta.value.dirty"
        />
      </template>
    </PageHeader>

    <SchoolContextBar :context="school" />

    <EmptyState
      v-if="loadError"
      icon="pi pi-exclamation-circle"
      title="Pengaturan tidak dapat dimuat"
      :description="loadError.message"
    />
    <div v-else-if="!settings && school.ready.value" class="center-block">
      <ProgressSpinner style="width: 3rem" />
    </div>
    <form
      v-else-if="settings"
      id="journal-settings"
      class="question-form"
      novalidate
      @submit="onSubmit"
    >
      <Card class="question-form__main">
        <template #title>Jurnal dan jadwal</template>
        <template #content>
          <div class="form-stack">
            <FormInputNumber
              name="maxPeriod"
              label="Jumlah jam pelajaran per hari"
              :min="1"
              :max="20"
              hint='Batas "jam ke" pada jurnal dan jadwal.'
              :disabled="readonly"
              required
            />
            <FormInputNumber
              name="editWindowDays"
              label="Jurnal bisa diisi/diubah sampai (hari ke belakang)"
              :min="0"
              :max="120"
              hint="Lewat dari batas ini jurnal terkunci. 0 = hanya hari ini."
              :disabled="readonly"
              required
            />
            <FormInputNumber
              name="scheduleMinOccurrences"
              label="Minimal muncul untuk jadi jadwal"
              :min="1"
              :max="20"
              hint="Pola jurnal (hari + jam ke + kelas + mapel) yang lebih jarang dari ini tidak dijadikan slot jadwal."
              :disabled="readonly"
              required
            />
          </div>
        </template>
      </Card>
      <Card class="question-form__side">
        <template #title>Tanda tangan laporan Excel</template>
        <template #content>
          <div class="form-stack">
            <FormInputText name="principalName" label="Nama kepala sekolah" :disabled="readonly" />
            <FormInputText name="principalNip" label="NIP kepala sekolah" :disabled="readonly" />
            <FormInputText
              name="reportCity"
              label="Kota"
              placeholder="Mis. Semarang"
              hint='Ditulis sebelum tanggal cetak: "Semarang, 19 Oktober 2026".'
              :disabled="readonly"
            />
          </div>
        </template>
      </Card>
    </form>
  </div>
</template>
