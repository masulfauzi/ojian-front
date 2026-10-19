import { describe, expect, it } from 'vitest'

// Pemeriksaan sumber modul landing (aturan issue-landing.md).
const sources = import.meta.glob('../**/*.{vue,js,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const files = Object.entries(sources).filter(([path]) => !path.includes('__tests__'))

const offenders = (pattern) => files.filter(([, text]) => pattern.test(text)).map(([path]) => path)

describe('aturan sumber landing', () => {
  it('memeriksa semua berkas modul', () => {
    expect(files.length).toBeGreaterThan(15)
  })

  it('tanpa warna tertulis langsung (#hex, rgb(), hsl())', () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)).toEqual([])
  })

  it('tanpa v-html dan library berat atau panggilan API', () => {
    expect(offenders(/v-html/)).toEqual([])
    expect(
      offenders(/axios|chart\.js|primevue\/chart|tiptap|katex|vue-draggable|@\/shared\/api/i),
    ).toEqual([])
  })

  it('hanya mengimpor @/modules/auth dari modul lain', () => {
    const imports = files.flatMap(([path, text]) =>
      [...text.matchAll(/from '(@\/modules\/[^']+)'/g)].map((m) => `${path}: ${m[1]}`),
    )
    expect(imports.filter((line) => !line.endsWith('@/modules/auth'))).toEqual([])
  })

  it('tautan eksternal memakai rel="noopener noreferrer"', () => {
    const blank = files.filter(([, text]) => /target="_blank"/.test(text))
    for (const [path, text] of blank) expect(text, path).toMatch(/rel="noopener noreferrer"/)
  })
})
