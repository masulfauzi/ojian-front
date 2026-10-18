import { describe, expect, it } from 'vitest'
import { ApiError, readBlobError } from '../../api/errors'
import { filenameFromDisposition } from '../download'

describe('filenameFromDisposition', () => {
  it('mengutamakan filename* UTF-8', () => {
    expect(
      filenameFromDisposition(
        `attachment; filename="jurnal.xlsx"; filename*=UTF-8''jurnal-mengajar_bu%20wali.xlsx`,
      ),
    ).toBe('jurnal-mengajar_bu wali.xlsx')
    expect(filenameFromDisposition('attachment; filename="rekap.xlsx"')).toBe('rekap.xlsx')
    expect(filenameFromDisposition(null, 'x.xlsx')).toBe('x.xlsx')
  })
})

describe('readBlobError', () => {
  it('membaca pesan dan kode dari respons Blob', async () => {
    const blob = new Blob([
      JSON.stringify({
        message: 'Rentang tanggal harus di dalam semester',
        code: 'JOURNAL_DATE_OUTSIDE_SEMESTER',
      }),
    ])
    const error = new ApiError({
      status: 422,
      message: 'Validasi gagal',
      cause: { response: { data: blob } },
    })
    const read = await readBlobError(error)
    expect(read.message).toBe('Rentang tanggal harus di dalam semester')
    expect(read.code).toBe('JOURNAL_DATE_OUTSIDE_SEMESTER')
    expect(read.status).toBe(422)
    // Bukan Blob → dikembalikan apa adanya.
    const plain = new ApiError({ status: 400, message: 'x' })
    expect(await readBlobError(plain)).toBe(plain)
  })
})
