import { getCurrentScope, onScopeDispose, ref, shallowRef } from 'vue'

/**
 * Kamera langsung di halaman (getUserMedia).
 *
 *   const camera = useCamera()
 *   await camera.start(videoEl)            // status: starting → live | denied | unsupported | error
 *   const blob = await camera.capture()    // JPEG, sisi terpanjang ≤ maxSize
 *   camera.stop()
 *
 * Bila kamera tidak bisa dipakai, halaman menawarkan pemilih foto bawaan perangkat sebagai
 * cadangan (input file `capture="user"`).
 */
export function useCamera({ facingMode = 'user', maxSize = 1280, quality = 0.85 } = {}) {
  const status = ref('idle')
  const error = ref('')
  const stream = shallowRef(null)
  let video = null

  const supported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  async function start(videoEl) {
    video = videoEl
    if (!supported) {
      status.value = 'unsupported'
      error.value = 'Kamera tidak didukung di browser ini.'
      return false
    }
    status.value = 'starting'
    error.value = ''
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      if (video) {
        video.srcObject = stream.value
        await video.play().catch(() => {})
      }
      status.value = 'live'
      return true
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
      status.value = denied ? 'denied' : 'error'
      error.value = denied
        ? 'Akses kamera ditolak. Izinkan kamera untuk situs ini, atau ambil foto dengan kamera perangkat.'
        : 'Kamera tidak dapat dibuka. Ambil foto dengan kamera perangkat.'
      return false
    }
  }

  function stop() {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null
    if (video) video.srcObject = null
    if (status.value === 'live' || status.value === 'starting') status.value = 'idle'
  }

  /** Ambil satu bingkai dari video sebagai Blob JPEG. */
  function capture() {
    if (!video || !video.videoWidth) return Promise.resolve(null)
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { status, error, stream, supported, start, stop, capture }
}
