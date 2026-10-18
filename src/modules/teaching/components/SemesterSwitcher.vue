<script setup>
import Select from 'primevue/select'
import Tag from 'primevue/tag'

// Pemilih semester kerja (jurnal & jadwal mengajar). `semester` = hasil useWorkingSemester.
defineProps({
  semester: { type: Object, required: true },
})
</script>

<template>
  <div class="semester-switcher">
    <Select
      :model-value="semester.id.value"
      :options="semester.options.value"
      option-label="label"
      option-value="value"
      placeholder="Pilih semester"
      aria-label="Semester"
      :loading="semester.calendar.loading.value"
      @update:model-value="semester.select"
    />
    <Tag
      v-if="semester.current.value && !semester.isActive.value"
      value="Bukan semester aktif"
      severity="secondary"
      icon="pi pi-lock"
    />
  </div>
</template>
