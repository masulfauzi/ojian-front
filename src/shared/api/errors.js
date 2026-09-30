// Normalisasi error axios menjadi bentuk seragam { status, message, fieldErrors }
// sehingga view dan store tidak perlu membaca struktur axios mentah.

export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {number} params.status  HTTP status, 0 bila tidak ada response (jaringan/timeout).
   * @param {string} params.message Pesan yang layak ditampilkan ke pengguna.
   * @param {Record<string, string>} [params.fieldErrors] Pesan error per field.
   */
  constructor({ status, message, fieldErrors = {}, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status ?? 0
    this.fieldErrors = fieldErrors
  }

  get hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0
  }
}

const DEFAULT_MESSAGES = {
  0: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  400: 'Permintaan tidak valid',
  401: 'Sesi Anda telah berakhir, silakan masuk kembali',
  403: 'Anda tidak memiliki akses',
  404: 'Data tidak ditemukan',
  409: 'Data bentrok dengan data yang sudah ada',
  422: 'Validasi gagal',
  429: 'Terlalu banyak permintaan, coba lagi nanti',
  500: 'Terjadi kesalahan pada server',
}

function toFieldErrors(errors) {
  if (!Array.isArray(errors)) return {}
  return errors.reduce((acc, item) => {
    // Simpan pesan pertama per field.
    if (item?.field && !acc[item.field]) acc[item.field] = item.message
    return acc
  }, {})
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error

  const response = error?.response
  if (!response) {
    const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
    return new ApiError({
      status: 0,
      message: timedOut ? 'Permintaan melebihi batas waktu' : DEFAULT_MESSAGES[0],
      cause: error,
    })
  }

  const { status, data } = response
  const fallback =
    DEFAULT_MESSAGES[status] ?? (status >= 500 ? DEFAULT_MESSAGES[500] : 'Terjadi kesalahan')
  return new ApiError({
    status,
    message: typeof data?.message === 'string' && data.message ? data.message : fallback,
    fieldErrors: toFieldErrors(data?.errors),
    cause: error,
  })
}

/**
 * Ganti nama field pada `fieldErrors` (mis. nama field backend `old_password` → `oldPassword`).
 * Dipakai di file `*.api.js` agar pemetaan kontrak backend tetap di satu tempat.
 */
export function remapFieldErrors(error, map) {
  if (!(error instanceof ApiError) || !error.hasFieldErrors) return error
  error.fieldErrors = Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, message]) => [map[field] ?? field, message]),
  )
  return error
}
