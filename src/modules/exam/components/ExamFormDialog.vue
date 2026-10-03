<script setup>
import { computed, watch } from 'vue'
import { useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormInputNumber from '@/shared/components/form/FormInputNumber.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { MAX_SECTIONS, examSchema } from '../schemas/exam.schema'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** Paket yang diubah; null = paket baru. */
  exam: { type: Object, default: null },
  /** [{ id, name, code, isActive }] */
  subjects: { type: Array, default: () => [] },
  /** Nomor bagian yang sudah berisi soal (tidak boleh dihapus). */
  usedSections: { type: Array, default: () => [] },
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.exam))
const form = useForm({ validationSchema: toTypedSchema(examSchema) })
const sections = useFieldArray('sections')
const applyServerErrors = useServerErrors(form)
const notify = useNotify()

const subjectOptions = computed(() =>
  props.subjects
    .filter((s) => s.isActive || s.id === props.exam?.subjectId)
    .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
)

watch(visible, (open) => {
  if (!open) return
  const e = props.exam
  form.resetForm({
    values: {
      title: e?.title ?? '',
      subjectId: e?.subjectId ?? null,
      gradeLevel: e?.gradeLevel ?? null,
      description: e?.description ?? '',
      sections: e?.sections?.length
        ? e.sections.map((s) => ({ title: s.title, instruction: s.instruction }))
        : [{ title: '', instruction: '' }],
    },
  })
})

// Nomor bagian = urutannya, jadi bagian hanya bisa dihapus bila bagian itu dan bagian
// sesudahnya belum berisi soal (nomor soal yang sudah ada tidak bergeser).
const canRemove = (index) =>
  sections.fields.value.length > 1 && !props.usedSections.some((no) => no >= index + 1)

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await props.submit(values)
    visible.value = false
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEdit ? 'Ubah paket ujian' : 'Buat paket ujian'"
    :style="{ width: 'min(46rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="exam-form" class="form-stack" novalidate @submit="onSubmit">
      <FormInputText
        name="title"
        label="Judul paket"
        placeholder="PTS Informatika Kelas X"
        required
      />
      <div class="form-grid">
        <FormSelect
          name="subjectId"
          label="Mata pelajaran"
          :options="subjectOptions"
          placeholder="Pilih mata pelajaran"
          required
        />
        <FormInputNumber name="gradeLevel" label="Tingkat" :min="1" :max="13" />
      </div>
      <FormTextarea
        name="description"
        label="Deskripsi"
        :rows="2"
        hint="Opsional. Catatan untuk guru, tidak ditampilkan ke siswa."
      />

      <div class="form-field">
        <span class="form-field__label">Bagian</span>
        <small class="form-field__hint"
          >Soal dikelompokkan per bagian. Urutan bagian tidak pernah diacak; soal diacak di dalam
          bagiannya.</small
        >
      </div>
      <div
        v-for="(field, index) in sections.fields.value"
        :key="field.key"
        class="exam-section-row"
      >
        <span class="exam-section-row__no">{{ index + 1 }}</span>
        <div class="exam-section-row__fields">
          <FormInputText
            :name="`sections[${index}].title`"
            :label="`Judul bagian ${index + 1}`"
            :placeholder="index === 0 ? 'Bagian I: Pilihan Ganda' : `Bagian ${index + 1}`"
          />
          <FormTextarea
            :name="`sections[${index}].instruction`"
            label="Petunjuk"
            :rows="1"
            placeholder="Pilih satu jawaban yang paling tepat."
          />
        </div>
        <Button
          v-tooltip.top="
            canRemove(index) ? 'Hapus bagian' : 'Bagian ini atau sesudahnya berisi soal'
          "
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :disabled="!canRemove(index)"
          :aria-label="`Hapus bagian ${index + 1}`"
          @click="sections.remove(index)"
        />
      </div>
      <div>
        <Button
          label="Tambah bagian"
          icon="pi pi-plus"
          size="small"
          text
          :disabled="sections.fields.value.length >= MAX_SECTIONS"
          @click="sections.push({ title: '', instruction: '' })"
        />
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
          form="exam-form"
          :label="isEdit ? 'Simpan' : 'Buat paket'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
