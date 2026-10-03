import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/**
 * Hitung mundur dari sisa detik yang dikirim SERVER (jam server adalah acuan). Waktu yang
 * berlalu diukur dengan jam monoton (`performance.now()`), jadi mengubah jam perangkat tidak
 * memengaruhi sisa waktu.
 *
 *   const countdown = useCountdown({ onExpire: submit })
 *   countdown.sync(attempt.remainingSeconds)   // tiap ada data baru dari server
 *   countdown.seconds.value                    // sisa detik (bulat), reaktif
 */
export function useCountdown({ onExpire, tickMs = 250 } = {}) {
  const seconds = ref(null)
  let deadline = null
  let timer = null
  let expired = false

  function update() {
    if (deadline === null) return
    const left = Math.max(0, Math.ceil((deadline - now()) / 1000))
    if (left !== seconds.value) seconds.value = left
    if (left === 0 && !expired) {
      expired = true
      stop()
      onExpire?.()
    }
  }

  /** Setel ulang dari sisa detik server; null menghentikan hitungan. */
  function sync(remainingSeconds) {
    if (remainingSeconds === null || remainingSeconds === undefined) {
      stop()
      deadline = null
      seconds.value = null
      return
    }
    deadline = now() + Math.max(0, remainingSeconds) * 1000
    expired = false
    update()
    if (!expired && !timer) timer = setInterval(update, tickMs)
  }

  function stop() {
    clearInterval(timer)
    timer = null
  }

  if (getCurrentScope()) onScopeDispose(stop)

  const running = computed(() => seconds.value !== null && seconds.value > 0)

  return { seconds, running, sync, stop }
}
