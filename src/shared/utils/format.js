const LOCALE = 'id-ID'

function toDate(value) {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Contoh: 15 Januari 2025 */
export function formatDate(value, options = { dateStyle: 'long' }) {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat(LOCALE, options).format(date) : '-'
}

/** Contoh: 15 Jan 2025 15.00 */
export function formatDateTime(value) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Contoh: 1.234.567 atau 12,5 */
export function formatNumber(value, options = {}) {
  const number = Number(value)
  return Number.isFinite(number) ? new Intl.NumberFormat(LOCALE, options).format(number) : '-'
}
