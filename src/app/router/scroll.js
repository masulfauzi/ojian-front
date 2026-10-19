// Perilaku gulir router: posisi tersimpan (tombol kembali), tautan jangkar (#bagian) dengan offset
// header lengket dan fokus ke judul bagian, selain itu ke atas halaman.

/** Tinggi elemen ber-`data-sticky-header` (mis. header landing), 0 bila tidak ada. */
const stickyOffset = () =>
  document.querySelector('[data-sticky-header]')?.getBoundingClientRect().height ?? 0

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Pindahkan fokus ke judul bagian (atau bagian itu sendiri) tanpa menggulir ulang. */
export function focusSection(el) {
  const target = el.matches?.('h1, h2, h3') ? el : (el.querySelector?.('h2, h1, h3') ?? el)
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

export function scrollBehavior(to, _from, saved) {
  if (saved) return saved
  if (to.hash) {
    let el = null
    try {
      el = document.querySelector(to.hash)
    } catch {
      el = null
    }
    if (el) {
      // Fokus setelah router selesai menggulir (pembaca layar ikut ke bagian tujuan).
      setTimeout(() => focusSection(el), 0)
      return {
        el: to.hash,
        top: stickyOffset() + 8,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      }
    }
  }
  return { top: 0 }
}
