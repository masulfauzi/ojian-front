// Perhitungan lokasi murni (tanpa API browser).

const EARTH_RADIUS_M = 6_371_000
const rad = (deg) => (deg * Math.PI) / 180

/** Jarak dua titik { latitude, longitude } dalam meter (haversine, sama dengan backend). */
export function distanceMeters(a, b) {
  if (!a || !b) return null
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** "850 m" / "14,4 km". */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return '-'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(meters / 1000)} km`
}

export const isValidCoordinate = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
