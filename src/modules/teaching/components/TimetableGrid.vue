<script setup>
import { computed } from 'vue'
import {
  layoutDays,
  periodCount,
  periodLabel,
  slotsForDay,
  subjectColor,
  visibleDays,
} from '../utils/timetable'

/**
 * Jadwal mingguan: kolom hari × baris jam ke. Slot multi-jam membentang beberapa baris; slot yang
 * beririsan (dua guru di kelas yang sama) tampil berdampingan. Di layar sempit menjadi daftar per hari.
 */
const props = defineProps({
  slots: { type: Array, default: () => [] },
  /** Jumlah jam minimal yang ditampilkan (biasanya max_period sekolah). */
  maxPeriod: { type: Number, default: 8 },
  /** Hari yang selalu tampil walau kosong. */
  days: { type: Array, default: () => [1, 2, 3, 4, 5] },
  /** Hari yang disorot (hari ini). */
  today: { type: Number, default: null },
  showTeacher: { type: Boolean, default: false },
  showClass: { type: Boolean, default: true },
  clickable: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const columns = computed(() => visibleDays(props.slots, props.days))
const rows = computed(() => periodCount(props.slots, props.maxPeriod))
const layout = computed(() => layoutDays(props.slots))
const lanesOf = (day) => Math.max(1, ...(layout.value[day] ?? []).map((p) => p.lanes))

const describe = (slot) =>
  [
    slot.subject?.name,
    props.showClass ? slot.class?.name : null,
    props.showTeacher ? slot.teacher?.name : null,
    `${slot.dayName} jam ${periodLabel(slot.periodFrom, slot.periodTo)}`,
    slot.source === 'generated' ? 'dari jurnal' : 'manual',
    slot.isLocked ? 'terkunci' : null,
  ]
    .filter(Boolean)
    .join(', ')

function select(slot) {
  if (props.clickable) emit('select', slot)
}
</script>

<template>
  <div class="timetable">
    <div
      class="timetable__grid"
      :style="{
        gridTemplateColumns: `3rem repeat(${columns.length}, minmax(7rem, 1fr))`,
        gridTemplateRows: `auto repeat(${rows}, 3.25rem)`,
      }"
      role="table"
      aria-label="Jadwal mingguan"
    >
      <div class="timetable__corner" role="columnheader">Jam</div>
      <div
        v-for="d in columns"
        :key="`h${d.value}`"
        class="timetable__day"
        :class="{ 'is-today': d.value === today }"
        role="columnheader"
      >
        {{ d.label }}
      </div>
      <div
        v-for="p in rows"
        :key="`p${p}`"
        class="timetable__period"
        :style="{ gridRow: p + 1, gridColumn: 1 }"
        role="rowheader"
      >
        {{ p }}
      </div>
      <div
        v-for="(d, index) in columns"
        :key="`c${d.value}`"
        class="timetable__column"
        :class="{ 'is-today': d.value === today }"
        :style="{
          gridColumn: index + 2,
          gridRow: `2 / span ${rows}`,
          gridTemplateRows: `repeat(${rows}, 3.25rem)`,
          gridTemplateColumns: `repeat(${lanesOf(d.value)}, minmax(0, 1fr))`,
        }"
      >
        <component
          :is="clickable ? 'button' : 'div'"
          v-for="{ slot, lane } in layout[d.value] ?? []"
          :key="slot.id"
          :type="clickable ? 'button' : undefined"
          class="timetable__slot"
          :class="[
            `tt-color-${subjectColor(slot.subject?.id)}`,
            { 'is-manual': slot.source === 'manual', 'is-locked': slot.isLocked },
          ]"
          :style="{ gridRow: `${slot.periodFrom} / ${slot.periodTo + 1}`, gridColumn: lane + 1 }"
          :aria-label="describe(slot)"
          :title="describe(slot)"
          @click="select(slot)"
        >
          <strong class="timetable__subject">{{ slot.subject?.name }}</strong>
          <span v-if="showClass" class="timetable__meta">{{ slot.class?.name }}</span>
          <span v-if="showTeacher" class="timetable__meta">{{ slot.teacher?.name }}</span>
          <span class="timetable__badges">
            <i v-if="slot.isLocked" class="pi pi-lock" aria-hidden="true" />
            <i v-if="slot.source === 'manual'" class="pi pi-pencil" aria-hidden="true" />
          </span>
        </component>
      </div>
    </div>

    <!-- Layar sempit: daftar per hari. -->
    <div class="timetable__list">
      <section v-for="d in columns" :key="`l${d.value}`" class="timetable__list-day">
        <h3 class="form-section-title" :class="{ 'is-today': d.value === today }">{{ d.label }}</h3>
        <p v-if="!slotsForDay(slots, d.value).length" class="text-muted">Tidak ada jadwal.</p>
        <component
          :is="clickable ? 'button' : 'div'"
          v-for="slot in slotsForDay(slots, d.value)"
          :key="slot.id"
          :type="clickable ? 'button' : undefined"
          class="timetable__list-item"
          :class="`tt-color-${subjectColor(slot.subject?.id)}`"
          :aria-label="describe(slot)"
          @click="select(slot)"
        >
          <span class="timetable__list-period"
            >Jam {{ periodLabel(slot.periodFrom, slot.periodTo) }}</span
          >
          <span>
            <strong>{{ slot.subject?.name }}</strong>
            <span v-if="showClass"> · {{ slot.class?.name }}</span>
            <span v-if="showTeacher"> · {{ slot.teacher?.name }}</span>
          </span>
          <i v-if="slot.isLocked" class="pi pi-lock" aria-hidden="true" />
        </component>
      </section>
    </div>
  </div>
</template>
