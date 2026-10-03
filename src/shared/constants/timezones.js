// Zona waktu Indonesia (IANA) untuk `schools.timezone`; kosong di backend = Asia/Jakarta.
export const DEFAULT_TIMEZONE = 'Asia/Jakarta'

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB — Waktu Indonesia Barat (UTC+7)', abbr: 'WIB' },
  { value: 'Asia/Makassar', label: 'WITA — Waktu Indonesia Tengah (UTC+8)', abbr: 'WITA' },
  { value: 'Asia/Jayapura', label: 'WIT — Waktu Indonesia Timur (UTC+9)', abbr: 'WIT' },
]

/** Singkatan zona (WIB/WITA/WIT); zona lain memakai namanya sendiri. */
export const timezoneAbbr = (tz) =>
  TIMEZONE_OPTIONS.find((option) => option.value === tz)?.abbr ?? tz ?? ''
