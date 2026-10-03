import { getCurrentScope, onScopeDispose, ref } from 'vue'

/**
 * Jalankan `task` berulang tiap `intervalMs`. Panggilan berikutnya dijadwalkan setelah yang
 * sebelumnya selesai (tidak menumpuk saat server lambat), dijeda selama tab tersembunyi, dan
 * berhenti otomatis saat komponen dilepas.
 *
 *   const polling = usePolling(load, 10_000)
 *   polling.start()          // langsung jalan sekali lalu berulang
 *   polling.refresh()        // jalankan sekarang dan atur ulang jadwal
 */
export function usePolling(task, intervalMs, { pauseWhenHidden = true } = {}) {
  const active = ref(false)
  const running = ref(false)
  let timer = null

  const hidden = () => pauseWhenHidden && typeof document !== 'undefined' && document.hidden

  function schedule() {
    clearTimeout(timer)
    if (active.value && !hidden()) timer = setTimeout(tick, intervalMs)
  }

  let current = null

  /**
   * Jalankan tugas sekarang. Bila putaran lain sedang berjalan, tunggu selesai lalu jalankan
   * lagi (agar data setelah sebuah aksi pasti dimuat ulang, bukan hasil putaran sebelumnya).
   */
  async function tick() {
    clearTimeout(timer)
    if (!active.value) return
    if (current) await current
    // Pemanggil lain sudah memulai putaran baru selama menunggu.
    if (current) return current
    running.value = true
    current = (async () => {
      try {
        await task()
      } catch {
        // Kegagalan satu putaran tidak menghentikan polling; `task` menampilkan errornya sendiri.
      } finally {
        running.value = false
        current = null
        schedule()
      }
    })()
    return current
  }

  function onVisibility() {
    if (!active.value) return
    if (document.hidden) clearTimeout(timer)
    else tick()
  }

  function start({ immediate = true } = {}) {
    if (active.value) return
    active.value = true
    if (pauseWhenHidden) document.addEventListener('visibilitychange', onVisibility)
    if (immediate) tick()
    else schedule()
  }

  function stop() {
    active.value = false
    clearTimeout(timer)
    if (pauseWhenHidden) document.removeEventListener('visibilitychange', onVisibility)
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { active, running, start, stop, refresh: tick }
}
