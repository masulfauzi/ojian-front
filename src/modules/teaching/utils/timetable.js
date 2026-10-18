// Fungsi murni untuk grid jadwal mengajar (hari × jam ke).

export const WEEKDAYS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 7, label: 'Minggu', short: 'Min' },
]
export const dayLabel = (value) => WEEKDAYS.find((d) => d.value === value)?.label ?? ''

/** "1" / "1–2". */
export const periodLabel = (from, to) => (from === to ? `${from}` : `${from}–${to}`)

/** Hari ISO (1 = Senin … 7 = Minggu) dari Date. */
export const isoDay = (date = new Date()) => ((date.getDay() + 6) % 7) + 1

/** Slot satu hari, urut jam ke. */
export const slotsForDay = (slots, day) =>
  slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.periodFrom - b.periodFrom)

const PALETTE = [
  'emerald',
  'sky',
  'amber',
  'violet',
  'rose',
  'teal',
  'orange',
  'indigo',
  'lime',
  'pink',
]

/** Warna tetap per mapel (kelas CSS `tt-color-<nama>`). */
export function subjectColor(subjectId) {
  let hash = 0
  for (const ch of subjectId ?? '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/**
 * Kolom hari yang ditampilkan: Senin–Jumat, ditambah Sabtu/Minggu bila ada slot di hari itu
 * atau diminta lewat `days`.
 */
export function visibleDays(slots, days = [1, 2, 3, 4, 5]) {
  const set = new Set([...days, ...slots.map((s) => s.dayOfWeek)])
  return WEEKDAYS.filter((d) => set.has(d.value))
}

/**
 * Susun slot per hari menjadi "lajur" agar slot yang beririsan (dua guru di kelas yang sama pada jam
 * yang sama) tampil berdampingan, bukan saling menutupi. Mengembalikan
 * `{ [day]: [{ slot, lane, lanes }] }`; `lanes` = jumlah lajur kelompok irisan slot itu.
 */
export function layoutDays(slots) {
  const out = {}
  for (const day of WEEKDAYS.map((d) => d.value)) {
    const daySlots = slotsForDay(slots, day)
    const placed = []
    let group = []
    let groupEnd = 0
    const flush = () => {
      const lanes = Math.max(1, ...group.map((p) => p.lane + 1))
      group.forEach((p) => (p.lanes = lanes))
      group = []
    }
    for (const slot of daySlots) {
      if (group.length && slot.periodFrom > groupEnd) flush()
      const used = new Set(
        group.filter((p) => p.slot.periodTo >= slot.periodFrom).map((p) => p.lane),
      )
      let lane = 0
      while (used.has(lane)) lane++
      const entry = { slot, lane, lanes: 1 }
      group.push(entry)
      placed.push(entry)
      groupEnd = Math.max(groupEnd, slot.periodTo)
    }
    if (group.length) flush()
    if (placed.length) out[day] = placed
  }
  return out
}

/** Jumlah baris jam yang perlu ditampilkan: maks(jam terakhir slot, minimal). */
export const periodCount = (slots, minimum = 8) =>
  Math.max(minimum, ...slots.map((s) => s.periodTo))

export const REASON_LABELS = {
  below_threshold: 'Terlalu jarang',
  conflict: 'Bentrok dengan pola lain',
  conflict_with_manual: 'Bentrok dengan slot manual/terkunci',
}
