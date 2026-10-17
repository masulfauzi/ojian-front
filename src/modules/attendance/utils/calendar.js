// Fungsi murni untuk kalender presensi bulanan.
import { toISODate } from '@/shared/utils/date'

/**
 * Sel kalender (Senin di kolom pertama) untuk bulan 'YYYY-MM'. `days` = hari sekolah dari API
 * ([{ date, status, … }]). Sel di luar bulan bernilai null; tanggal tanpa entri = bukan hari
 * sekolah (`schoolDay: false`).
 */
export function monthCells(month, days = []) {
  const [y, m] = (month ?? '').split('-').map(Number)
  if (!y || !m) return []
  const byDate = new Map(days.map((d) => [d.date, d]))
  const first = new Date(y, m - 1, 1)
  const lead = (first.getDay() + 6) % 7 // Senin = 0
  const count = new Date(y, m, 0).getDate()
  const cells = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) {
    const iso = toISODate(new Date(y, m - 1, d))
    const entry = byDate.get(iso)
    cells.push({ date: iso, day: d, schoolDay: Boolean(entry), entry: entry ?? null })
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

/** Persentase kehadiran untuk tampilan ("80%" / "-"). */
export const percentText = (value) =>
  value === null || value === undefined
    ? '-'
    : `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value)}%`

/**
 * Jam dinding "07.12" dari waktu RFC 3339 server (sudah ber-offset zona sekolah). Sengaja tidak
 * dikonversi ke zona perangkat: yang relevan adalah jam di sekolah.
 */
export const wallTime = (iso) =>
  (/T(\d{2}):(\d{2})/.exec(iso ?? '') ?? []).slice(1).join('.') || '-'
