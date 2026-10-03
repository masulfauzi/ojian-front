<script setup>
import EmptyState from '@/shared/components/EmptyState.vue'
import { SchoolSelect } from '@/modules/school'

// Pemilih sekolah untuk pengguna platform (super admin) di halaman akademik.
// Untuk pengguna sekolah komponen ini tidak menampilkan apa pun.
defineProps({
  /** Hasil useSchoolContext(). */
  context: { type: Object, required: true },
})
</script>

<template>
  <template v-if="context.isPlatform.value">
    <div class="school-context">
      <span class="school-context__label"
        ><i class="pi pi-building" aria-hidden="true" /> Sekolah</span
      >
      <div class="school-context__select">
        <SchoolSelect
          :model-value="context.schoolId.value"
          placeholder="Pilih sekolah yang dikelola"
          active-only
          @update:model-value="context.setSchool"
        />
      </div>
    </div>
    <EmptyState
      v-if="!context.ready.value"
      icon="pi pi-building"
      title="Pilih sekolah"
      description="Data akademik dikelola per sekolah. Pilih sekolah di atas untuk melanjutkan."
    />
  </template>
</template>
