// Satu-satunya tempat yang mengimpor KaTeX beserta CSS-nya. Dipakai RichTextEditor dan
// RichTextViewer, sehingga CSS KaTeX hanya dimuat pada halaman yang benar-benar merender rumus.
import katex from 'katex'
import 'katex/dist/katex.min.css'

export const KATEX_OPTIONS = Object.freeze({
  throwOnError: false,
  // `trust: false` mencegah perintah seperti \href / \includegraphics menyisipkan URL.
  trust: false,
  strict: 'ignore',
})

export function renderMathToString(latex, displayMode = false) {
  return katex.renderToString(latex ?? '', { ...KATEX_OPTIONS, displayMode })
}
