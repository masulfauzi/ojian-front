<script setup>
import { ATTENDANCE_STATUSES } from '../constants'
import { percentText } from '../utils/calendar'

// Ringkasan rekap bulanan: persentase kehadiran + jumlah per status.
defineProps({
  /** { schoolDays, present, late, excused, sick, absent, attendancePercent } */
  summary: { type: Object, required: true },
})
</script>

<template>
  <div class="month-summary">
    <div class="month-summary__percent">
      <span class="month-summary__value">{{ percentText(summary.attendancePercent) }}</span>
      <span class="text-muted">kehadiran dari {{ summary.schoolDays }} hari sekolah</span>
    </div>
    <ul class="month-summary__counts plain-list">
      <li v-for="s in ATTENDANCE_STATUSES" :key="s.value" :class="`is-${s.value}`">
        <span class="month-summary__count">{{ summary[s.value] ?? 0 }}</span>
        <span class="text-muted">{{ s.label }}</span>
      </li>
    </ul>
  </div>
</template>
