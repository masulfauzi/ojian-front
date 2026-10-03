<script setup>
import { ScheduleListPage } from '@/modules/schedule'
</script>

<template>
  <ScheduleListPage
    title="Hasil Ujian"
    description="Rekap nilai, penilaian jawaban uraian, dan analisis butir soal per jadwal"
    target="result"
    published-only
    :show-create="false"
  />
</template>
