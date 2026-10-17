import { ref } from 'vue'

const MESSAGES = {
  1: 'Akses lokasi ditolak. Izinkan lokasi untuk situs ini di pengaturan browser.',
  2: 'Lokasi tidak tersedia. Aktifkan GPS/lokasi perangkat lalu coba lagi.',
  3: 'Mencari lokasi terlalu lama. Pindah ke tempat terbuka lalu coba lagi.',
}

/**
 * Lokasi perangkat sekali ambil.
 *
 *   const geo = useGeolocation()
 *   const pos = await geo.locate()   // { latitude, longitude, accuracy } atau melempar Error
 */
export function useGeolocation() {
  const position = ref(null)
  const locating = ref(false)
  const error = ref('')
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function locate({ timeout = 20_000, highAccuracy = true, maximumAge = 0 } = {}) {
    if (!supported) {
      error.value = 'Perangkat atau browser tidak mendukung lokasi.'
      return Promise.reject(new Error(error.value))
    }
    locating.value = true
    error.value = ''
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locating.value = false
          position.value = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          }
          resolve(position.value)
        },
        (err) => {
          locating.value = false
          error.value = MESSAGES[err?.code] ?? 'Lokasi tidak dapat diambil.'
          reject(new Error(error.value))
        },
        { enableHighAccuracy: highAccuracy, timeout, maximumAge },
      )
    })
  }

  return { position, locating, error, supported, locate }
}
