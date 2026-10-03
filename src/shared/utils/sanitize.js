import DOMPurify from 'dompurify'
import { renderMathToString } from './math'

const MATH_SELECTOR = '[data-type="inline-math"], [data-type="block-math"]'

// Tahap 1: HTML dari pengguna/backend. Hanya profil HTML (tanpa SVG/MathML mentah),
// atribut `data-type`/`data-latex` diizinkan untuk node rumus TipTap.
const INPUT_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['data-type', 'data-latex', 'data-media-id', 'target'],
  FORBID_TAGS: [
    'style',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'iframe',
    'object',
    'embed',
  ],
  FORBID_ATTR: ['style'],
}

// Tahap 2: setelah rumus dirender KaTeX (butuh MathML, SVG, dan atribut style).
const OUTPUT_CONFIG = {
  USE_PROFILES: { html: true, svg: true, mathMl: true },
  ADD_ATTR: ['data-type', 'data-latex', 'data-media-id', 'target', 'encoding'],
  FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed'],
}

let hooksInstalled = false

function installHooks() {
  if (hooksInstalled) return
  hooksInstalled = true
  // Tautan yang membuka tab baru selalu diberi rel aman.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })
}

/**
 * Bersihkan HTML kaya (keluaran RichTextEditor) lalu render rumus KaTeX di dalamnya.
 * Membuang <script>, handler `on*`, URL `javascript:`, iframe, dan sejenisnya.
 */
export function sanitizeRichText(html) {
  if (!html) return ''
  installHooks()

  const clean = DOMPurify.sanitize(html, INPUT_CONFIG)

  // <template> tidak mengeksekusi skrip atau memuat gambar saat di-parse.
  const template = document.createElement('template')
  template.innerHTML = clean
  template.content.querySelectorAll(MATH_SELECTOR).forEach((el) => {
    const displayMode = el.getAttribute('data-type') === 'block-math'
    el.innerHTML = renderMathToString(el.getAttribute('data-latex') ?? '', displayMode)
  })

  return DOMPurify.sanitize(template.innerHTML, OUTPUT_CONFIG)
}
