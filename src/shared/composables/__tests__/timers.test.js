import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useCountdown } from '../useCountdown'
import { usePolling } from '../usePolling'

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
  })
})
afterEach(() => vi.useRealTimers())

describe('useCountdown', () => {
  it('menghitung mundur dari sisa detik server lalu memanggil onExpire sekali', async () => {
    const onExpire = vi.fn()
    const scope = effectScope()
    const countdown = scope.run(() => useCountdown({ onExpire }))
    countdown.sync(3)
    expect(countdown.seconds.value).toBe(3)
    vi.advanceTimersByTime(1100)
    expect(countdown.seconds.value).toBe(2)
    // Sinkron ulang dari server (mis. waktu ditambah pengawas).
    countdown.sync(10)
    expect(countdown.seconds.value).toBe(10)
    vi.advanceTimersByTime(11_000)
    expect(countdown.seconds.value).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('null menghentikan hitungan', () => {
    const countdown = useCountdown()
    countdown.sync(5)
    countdown.sync(null)
    expect(countdown.seconds.value).toBeNull()
    expect(countdown.running.value).toBe(false)
  })
})

describe('usePolling', () => {
  it('berulang setelah tugas selesai dan berhenti saat scope dilepas', async () => {
    const task = vi.fn().mockResolvedValue()
    const scope = effectScope()
    const polling = scope.run(() => usePolling(task, 1000))
    polling.start()
    await nextTick()
    expect(task).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(task).toHaveBeenCalledTimes(2)
    scope.stop()
    await vi.advanceTimersByTimeAsync(5000)
    expect(task).toHaveBeenCalledTimes(2)
  })

  it('kegagalan tugas tidak menghentikan polling', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue()
    const polling = usePolling(task, 500)
    polling.start()
    await vi.advanceTimersByTimeAsync(500)
    expect(task).toHaveBeenCalledTimes(2)
    polling.stop()
  })

  it('refresh saat putaran berjalan menunggu lalu memuat ulang', async () => {
    let release
    const task = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
      .mockResolvedValue()
    const polling = usePolling(task, 10_000)
    polling.start()
    const refreshed = polling.refresh()
    expect(task).toHaveBeenCalledTimes(1)
    release()
    await refreshed
    expect(task).toHaveBeenCalledTimes(2)
    polling.stop()
  })
})
