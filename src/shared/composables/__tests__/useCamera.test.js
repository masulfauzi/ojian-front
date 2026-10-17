import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCamera } from '../useCamera'

const original = navigator.mediaDevices
afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { value: original, configurable: true })
})
const setMedia = (getUserMedia) =>
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })

describe('useCamera', () => {
  it('izin ditolak → status denied dengan pesan', async () => {
    setMedia(vi.fn().mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' })))
    const camera = useCamera()
    expect(await camera.start(null)).toBe(false)
    expect(camera.status.value).toBe('denied')
    expect(camera.error.value).toMatch(/ditolak/)
  })

  it('berhasil → live, stop menghentikan track', async () => {
    const stop = vi.fn()
    setMedia(vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }))
    const video = { play: vi.fn().mockResolvedValue(), srcObject: null }
    const camera = useCamera()
    expect(await camera.start(video)).toBe(true)
    expect(camera.status.value).toBe('live')
    expect(video.srcObject).not.toBeNull()
    camera.stop()
    expect(stop).toHaveBeenCalled()
    expect(camera.status.value).toBe('idle')
  })
})
