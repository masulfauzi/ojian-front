import { describe, expect, it } from 'vitest'
import { mapStrings, mediaIdsIn, mediaIdsInJson, stripMediaSrc, withMediaUrls } from '../mediaHtml'
import { sanitizeRichText } from '../sanitize'

const ID = '3f1c2a4e-8b7d-4c1e-9a2f-6d5e4c3b2a10'
const ID2 = '8a1c2a4e-8b7d-4c1e-9a2f-6d5e4c3b2a10'

describe('mediaHtml', () => {
  it('mediaIdsIn mengambil ID unik', () => {
    expect(
      mediaIdsIn(
        `<img data-media-id="${ID}"><img data-media-id="${ID}"><img data-media-id="${ID2}">`,
      ),
    ).toEqual([ID, ID2])
    expect(mediaIdsIn('')).toEqual([])
  })

  it('withMediaUrls mengisi src, stripMediaSrc membuangnya', () => {
    const filled = withMediaUrls(`<p>a</p><img data-media-id="${ID}" alt="x">`, {
      [ID]: 'http://minio/x.png?sig=1',
    })
    expect(filled).toContain('src="http://minio/x.png?sig=1"')
    const stripped = stripMediaSrc(filled)
    expect(stripped).not.toContain('src=')
    expect(stripped).toContain(`data-media-id="${ID}"`)
    // Gambar URL biasa (tanpa data-media-id) tidak diubah.
    expect(stripMediaSrc('<img src="https://a/b.png">')).toBe('<img src="https://a/b.png">')
  })

  it('mapStrings dan mediaIdsInJson menelusuri struktur bersarang', () => {
    const content = {
      prompt: `<img data-media-id="${ID}">`,
      options: [{ id: 'o1', text: `<img data-media-id="${ID2}">` }],
      n: 1,
    }
    expect(mediaIdsInJson(content).sort()).toEqual([ID, ID2].sort())
    expect(mapStrings(content, (s) => s.toUpperCase()).options[0].id).toBe('O1')
    expect(mapStrings(content, (s) => s).n).toBe(1)
  })

  it('sanitasi mempertahankan data-media-id', () => {
    expect(sanitizeRichText(`<img data-media-id="${ID}" src="http://x/y.png">`)).toContain(
      `data-media-id="${ID}"`,
    )
  })
})
