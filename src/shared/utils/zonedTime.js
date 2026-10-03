import { DEFAULT_TIMEZONE, timezoneAbbr } from '../constants/timezones'

// Waktu ujian disimpan backend dalam UTC dan ditampilkan/diisi menurut zona waktu SEKOLAH,
// bukan zona perangkat (guru di Jakarta bisa mengelola sekolah di Jayapura).

const LOCALE = 'id-ID'
const partsFormatters = new Map()

function partsFormatter(tz) {
  if (!partsFormatters.has(tz)) {
    partsFormatters.set(
      tz,
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }),
    )
  }
  return partsFormatters.get(tz)
}

/** Jam dinding { year, month, day, hour, minute, second } dari satu instan di zona `tz`. */
export function wallClock(ms, tz = DEFAULT_TIMEZONE) {
  const parts = Object.fromEntries(
    partsFormatter(tz)
      .formatToParts(new Date(ms))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  )
  return parts
}

/** Selisih zona terhadap UTC (menit) pada instan `ms`. WIB = 420. */
export function offsetMinutes(ms, tz = DEFAULT_TIMEZONE) {
  const w = wallClock(ms, tz)
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000)
}

const pad = (n, width = 2) => String(Math.abs(n)).padStart(width, '0')

function offsetText(minutes) {
  const sign = minutes < 0 ? '-' : '+'
  return `${sign}${pad(Math.trunc(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`
}

const toMs = (value) => {
  if (value === null || value === undefined || value === '') return null
  const ms =
    value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Untuk DatePicker: Date "lokal semu" yang jam dindingnya sama dengan jam di zona sekolah.
 * (DatePicker selalu bekerja dengan zona perangkat.)
 */
export function toZonedInput(iso, tz = DEFAULT_TIMEZONE) {
  const ms = toMs(iso)
  if (ms === null) return null
  const w = wallClock(ms, tz)
  return new Date(w.year, w.month - 1, w.day, w.hour, w.minute, 0, 0)
}

/** Kebalikan `toZonedInput`: jam dinding di zona sekolah → RFC 3339 dengan offset zona itu. */
export function fromZonedInput(date, tz = DEFAULT_TIMEZONE) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const mo = date.getMonth()
  const d = date.getDate()
  const h = date.getHours()
  const mi = date.getMinutes()
  const guess = Date.UTC(y, mo, d, h, mi)
  // Dua kali agar benar di sekitar pergantian DST (Indonesia tidak memakai DST).
  let offset = offsetMinutes(guess, tz)
  offset = offsetMinutes(guess - offset * 60000, tz)
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}:00${offsetText(offset)}`
}

/**
 * Teks ketikan "dd/mm/yyyy hh:mm" (24 jam) → Date lokal (jam dinding), null bila tidak valid.
 * DatePicker PrimeVue 4.5 gagal mem-parse jam 24-jam yang diketik (memanggil
 * `ampm.toLowerCase()` pada undefined), jadi `FormDateTimePicker` mem-parse sendiri saat blur.
 */
export function parseWallClockText(text) {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s+(\d{1,2})[:.](\d{2})\s*$/.exec(text ?? '')
  if (!m) return null
  const [day, month, year, hour, minute] = m.slice(1).map(Number)
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  // Tolak tanggal yang "meluap" (mis. 31/02).
  return date.getDate() === day && date.getMonth() === month - 1 ? date : null
}

/** Ubah ISO apa pun menjadi RFC 3339 dengan offset zona sekolah (jam dinding sekolah). */
export function toZonedISO(iso, tz = DEFAULT_TIMEZONE) {
  return fromZonedInput(toZonedInput(iso, tz), tz)
}

/**
 * Tampilkan waktu menurut zona sekolah, mis. "Sab, 3 Okt 2026 07.30 WIB".
 * `withDate: false` → "07.30 WIB"; `withZone: false` tanpa singkatan zona.
 */
export function formatZoned(iso, tz = DEFAULT_TIMEZONE, { withDate = true, withZone = true } = {}) {
  const ms = toMs(iso)
  if (ms === null) return '-'
  const options = { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  if (withDate)
    Object.assign(options, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const text = new Intl.DateTimeFormat(LOCALE, options).format(new Date(ms))
  return withZone ? `${text} ${timezoneAbbr(tz)}` : text
}

/** Rentang waktu ringkas: hari sama → "Sab, 3 Okt 2026 07.30–09.00 WIB". */
export function formatZonedRange(startIso, endIso, tz = DEFAULT_TIMEZONE) {
  const start = toMs(startIso)
  const end = toMs(endIso)
  if (start === null || end === null) return '-'
  const a = wallClock(start, tz)
  const b = wallClock(end, tz)
  const sameDay = a.year === b.year && a.month === b.month && a.day === b.day
  const head = formatZoned(start, tz, { withZone: false })
  const tail = formatZoned(end, tz, { withDate: !sameDay, withZone: false })
  return `${head}–${tail} ${timezoneAbbr(tz)}`
}

/** Durasi detik → "1:05:09" / "05:09". */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds ?? 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
