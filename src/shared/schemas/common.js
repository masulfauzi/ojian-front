// Aturan Zod yang dipakai ulang + error map global berbahasa Indonesia.
// Setiap file `*.schema.js` mengimpor dari sini sehingga error map selalu terpasang.
import { z } from 'zod'

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

function indonesianErrorMap(issue, ctx) {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null')
        return { message: 'wajib diisi' }
      return { message: 'tipe data tidak valid' }

    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return {
          message: issue.minimum === 1 ? 'wajib diisi' : `minimal ${issue.minimum} karakter`,
        }
      }
      if (issue.type === 'array') return { message: `minimal ${issue.minimum} item` }
      return { message: `minimal ${issue.minimum}` }

    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `maksimal ${issue.maximum} karakter` }
      if (issue.type === 'array') return { message: `maksimal ${issue.maximum} item` }
      return { message: `maksimal ${issue.maximum}` }

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'format email tidak valid' }
      if (issue.validation === 'url') return { message: 'format URL tidak valid' }
      if (issue.validation === 'uuid') return { message: 'harus berupa UUID yang valid' }
      return { message: 'format tidak valid' }

    case z.ZodIssueCode.invalid_enum_value:
      return { message: `harus salah satu dari: ${issue.options.join(', ')}` }

    default:
      return { message: ctx.defaultError }
  }
}

z.setErrorMap(indonesianErrorMap)

/** String wajib, di-trim. */
export const requiredString = (max = 255) => z.string().trim().min(1).max(max)

/** Email: di-trim, huruf kecil, format email, maks 255 karakter. */
export const emailField = () => z.string().trim().toLowerCase().min(1).max(255).email()

/** Password baru: 8 sampai 72 karakter (batas bcrypt di backend). */
export const passwordField = () => z.string().min(PASSWORD_MIN).max(PASSWORD_MAX)

/** Password yang sudah ada (login, password lama): cukup wajib diisi dan maks 72. */
export const existingPasswordField = () => z.string().min(1).max(PASSWORD_MAX)

/** Nama orang: 2 sampai 150 karakter. */
export const personNameField = () => z.string().trim().min(2).max(150)

export { z }
