/** Simpan Blob sebagai file unduhan di browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Beri waktu browser memulai unduhan sebelum URL dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// BOM UTF-8 agar Excel membaca karakter non-ASCII dengan benar.
const BOM = String.fromCharCode(0xfeff)

const escapeCsv = (value) => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Susun teks CSV dengan BOM UTF-8 (agar Excel membaca karakter dengan benar).
 *
 *   toCsv(rows, [{ key: 'nisn', label: 'NISN' }, { key: 'name', label: 'Nama' }])
 */
export function toCsv(rows, columns) {
  const lines = [
    columns.map((col) => escapeCsv(col.label)).join(','),
    ...rows.map((row) => columns.map((col) => escapeCsv(row[col.key])).join(',')),
  ]
  return `${BOM}${lines.join('\r\n')}\r\n`
}

/** Unduh baris data sebagai file CSV. */
export function downloadCsv(rows, columns, filename) {
  downloadBlob(new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' }), filename)
}
