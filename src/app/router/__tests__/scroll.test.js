import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusSection, scrollBehavior } from '../scroll'

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('scrollBehavior', () => {
  it('posisi tersimpan diutamakan, tanpa hash ke atas', () => {
    expect(scrollBehavior({ hash: '#fitur' }, {}, { left: 0, top: 120 })).toEqual({
      left: 0,
      top: 120,
    })
    expect(scrollBehavior({ hash: '' }, {}, null)).toEqual({ top: 0 })
    expect(scrollBehavior({ hash: '#tidak-ada' }, {}, null)).toEqual({ top: 0 })
  })

  it('jangkar: offset tinggi header lengket, lalu fokus ke judul bagian', () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<header data-sticky-header></header><section id="fitur"><h2 id="fitur-judul">Fitur</h2></section>'
    document.querySelector('[data-sticky-header]').getBoundingClientRect = () => ({ height: 56 })
    window.matchMedia = () => ({ matches: true })
    const result = scrollBehavior({ hash: '#fitur' }, {}, null)
    expect(result).toEqual({ el: '#fitur', top: 64, behavior: 'auto' })
    vi.runAllTimers()
    const heading = document.getElementById('fitur-judul')
    expect(document.activeElement).toBe(heading)
    expect(heading.getAttribute('tabindex')).toBe('-1')
  })

  it('focusSection memakai elemen itu sendiri bila tidak ada judul', () => {
    document.body.innerHTML = '<div id="x">isi</div>'
    const el = document.getElementById('x')
    focusSection(el)
    expect(document.activeElement).toBe(el)
  })
})
