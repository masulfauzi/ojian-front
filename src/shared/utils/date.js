// Tanggal tanpa jam ('YYYY-MM-DD') dari backend. `new Date('2026-07-13')` dibaca sebagai UTC
// sehingga bisa bergeser sehari di zona waktu tertentu; fungsi ini selalu memakai tanggal lokal.
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (n) => String(n).padStart(2, '0')

/** Date → 'YYYY-MM-DD' (tanggal lokal). Nilai kosong/tidak valid → null. */
export function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 'YYYY-MM-DD' → Date lokal pukul 00:00. Format lain → null. */
export function fromISODate(value) {
  const match = typeof value === 'string' ? ISO_DATE.exec(value) : null
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null
}

export const isISODate = (value) => fromISODate(value) !== null

// ---- Bulan ('YYYY-MM', format API rekap) ----

const MONTH_KEY = /^(\d{4})-(\d{2})$/

/** Date → 'YYYY-MM' (bulan lokal). */
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

/** Geser 'YYYY-MM' sebanyak `n` bulan (negatif = mundur). */
export function shiftMonth(key, n) {
  const match = MONTH_KEY.exec(key ?? '')
  if (!match) return key
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + n, 1)
  return monthKey(date)
}

/** 'YYYY-MM' → "Oktober 2026". */
export function monthLabel(key) {
  const match = MONTH_KEY.exec(key ?? '')
  if (!match) return key ?? ''
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(Number(match[1]), Number(match[2]) - 1, 1),
  )
}

/** Tambah `n` hari ke 'YYYY-MM-DD'. */
export function addDays(iso, n) {
  const date = fromISODate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + n)
  return toISODate(date)
}
