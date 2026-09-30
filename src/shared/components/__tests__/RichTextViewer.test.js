import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RichTextViewer from '../RichTextViewer.vue'

const render = (html) => mount(RichTextViewer, { props: { html } })

describe('RichTextViewer', () => {
  it('membuang <script>, handler on*, dan URL javascript:', () => {
    const wrapper = render(
      '<p onclick="alert(1)">Halo</p>' +
        '<img src="x" onerror="alert(\'xss\')">' +
        '<script>alert("xss")</' +
        'script>' +
        '<a href="javascript:alert(1)">tautan</a>' +
        '<iframe src="https://evil.example"></iframe>',
    )
    const html = wrapper.html()

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/onclick/i)
    expect(html).not.toMatch(/javascript:/i)
    expect(html).not.toContain('alert')
    // Konten aman tetap ada.
    expect(wrapper.text()).toContain('Halo')
    expect(wrapper.find('img').attributes('src')).toBe('x')
  })

  it('merender rumus inline dan blok dengan KaTeX', () => {
    const wrapper = render(
      '<p>Nilai <span data-type="inline-math" data-latex="\\frac{a}{b}"></span></p>' +
        '<div data-type="block-math" data-latex="\\sum_{i=1}^{n} i"></div>',
    )

    expect(wrapper.find('[data-type="inline-math"] .katex').exists()).toBe(true)
    expect(wrapper.find('[data-type="block-math"] .katex-display').exists()).toBe(true)
    expect(wrapper.find('.mfrac').exists()).toBe(true)
  })

  it('LaTeX berbahaya di data-latex tidak menghasilkan tautan javascript:', () => {
    const wrapper = render(
      '<span data-type="inline-math" data-latex="\\href{javascript:alert(1)}{klik}"></span>',
    )
    expect(wrapper.html()).not.toMatch(/href="javascript:/i)
  })

  it('HTML kosong menghasilkan elemen kosong', () => {
    expect(render('').text()).toBe('')
  })
})
