<script setup>
import { ScheduleListPage } from '@/modules/schedule'
</script>

<template>
  <ScheduleListPage
    title="Pemantauan Ujian"
    description="Pilih jadwal untuk melihat token dan memantau peserta"
    target="monitor"
    published-only
    :show-create="false"
  />
</template>
