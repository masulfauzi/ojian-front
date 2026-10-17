// Fungsi murni untuk berkas bukti izin.

export const isImage = (mime) => /^image\//.test(mime ?? '')
export const isPdf = (mime) => mime === 'application/pdf'

/** "4,4 KB" / "1,2 MB". */
export function fileSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${fmt(bytes / 1024)} KB`
  return `${fmt(bytes / (1024 * 1024))} MB`
}

/** Validasi awal di klien (server tetap memeriksa isi berkas). */
export function fileProblem(file, { maxMb = 5 } = {}) {
  if (!isImage(file.type) && !isPdf(file.type)) return 'Hanya foto (JPEG, PNG, WebP) atau PDF.'
  if (isImage(file.type) && !/^image\/(jpeg|png|webp)$/.test(file.type))
    return 'Format foto harus JPEG, PNG, atau WebP.'
  if (file.size > maxMb * 1024 * 1024) return `Ukuran maksimal ${maxMb} MB.`
  return null
}
