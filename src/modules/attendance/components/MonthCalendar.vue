<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import { monthLabel, shiftMonth } from '@/shared/utils/date'
import { SOURCE_LABELS, WEEKDAYS, attendanceStatusOf } from '../constants'
import { monthCells, wallTime } from '../utils/calendar'

// Kalender presensi satu bulan: tiap hari sekolah berwarna sesuai status.
const month = defineModel('month', { type: String, required: true })
const props = defineProps({
  /** [{ date, status, source, checkedInAt, lateMinutes }] — hanya hari sekolah. */
  days: { type: Array, default: () => [] },
  /** Tanggal hari ini menurut sekolah (disorot). */
  today: { type: String, default: null },
  loading: { type: Boolean, default: false },
  /** Bulan paling akhir yang boleh dibuka ('YYYY-MM'). */
  maxMonth: { type: String, default: null },
})

const cells = computed(() => monthCells(month.value, props.days))
const canNext = computed(() => !props.maxMonth || month.value < props.maxMonth)

function describe(cell) {
  if (!cell.schoolDay) return `${cell.date}: bukan hari sekolah`
  const status = attendanceStatusOf(cell.entry.status)
  const parts = [`${cell.date}: ${status.label}`]
  if (cell.entry.lateMinutes) parts.push(`${cell.entry.lateMinutes} menit`)
  if (cell.entry.checkedInAt) parts.push(`pukul ${wallTime(cell.entry.checkedInAt)}`)
  if (cell.entry.source) parts.push(SOURCE_LABELS[cell.entry.source] ?? cell.entry.source)
  return parts.join(' · ')
}
</script>

<template>
  <div class="month-calendar" :class="{ 'is-loading': loading }">
    <div class="month-calendar__head">
      <Button
        icon="pi pi-angle-left"
        severity="secondary"
        text
        rounded
        aria-label="Bulan sebelumnya"
        @click="month = shiftMonth(month, -1)"
      />
      <strong class="month-calendar__title">{{ monthLabel(month) }}</strong>
      <Button
        icon="pi pi-angle-right"
        severity="secondary"
        text
        rounded
        aria-label="Bulan berikutnya"
        :disabled="!canNext"
        @click="month = shiftMonth(month, 1)"
      />
    </div>
    <div class="month-calendar__grid" role="grid" :aria-label="`Presensi ${monthLabel(month)}`">
      <span
        v-for="w in WEEKDAYS"
        :key="w.value"
        class="month-calendar__weekday"
        role="columnheader"
        >{{ w.short }}</span
      >
      <template v-for="(cell, index) in cells" :key="cell?.date ?? `x${index}`">
        <span v-if="!cell" class="month-calendar__cell is-empty" />
        <span
          v-else
          v-tooltip.top="describe(cell)"
          class="month-calendar__cell"
          :class="[
            cell.schoolDay ? `is-${cell.entry.status ?? 'none'}` : 'is-off',
            { 'is-today': cell.date === today },
          ]"
          role="gridcell"
          :aria-label="describe(cell)"
        >
          <span class="month-calendar__day">{{ cell.day }}</span>
          <span v-if="cell.schoolDay" class="month-calendar__mark">{{
            attendanceStatusOf(cell.entry.status).short
          }}</span>
        </span>
      </template>
    </div>
  </div>
</template>
