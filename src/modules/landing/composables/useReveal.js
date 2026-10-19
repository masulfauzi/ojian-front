import { onBeforeUnmount, onMounted } from 'vue'

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Animasi muncul saat digulir untuk elemen `[data-reveal]` di dalam `rootRef`.
 * Kelas penyembunyi (`reveal-pending`) hanya dipasang bila IntersectionObserver tersedia dan
 * pengguna tidak meminta gerak minimal, sehingga konten tetap terlihat bila skrip gagal.
 */
export function useReveal(rootRef) {
  let observer = null

  onMounted(() => {
    const root = rootRef.value
    if (!root || reducedMotion() || typeof IntersectionObserver === 'undefined') return
    const items = [...root.querySelectorAll('[data-reveal]')]
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('reveal-in')
          entry.target.classList.remove('reveal-pending')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    for (const el of items) {
      // Elemen yang sudah terlihat saat dimuat tidak dianimasikan (tanpa kedipan).
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight) continue
      el.classList.add('reveal-pending')
      observer.observe(el)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())
}
