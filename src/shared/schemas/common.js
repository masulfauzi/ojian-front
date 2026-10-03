// Aturan Zod yang dipakai ulang + error map global berbahasa Indonesia.
// Setiap file `*.schema.js` mengimpor dari sini sehingga error map selalu terpasang.
import { z } from 'zod'
import { isISODate } from '@/shared/utils/date'

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

/**
 * String opsional: di-trim, string kosong/null/undefined menjadi `null` (tidak dikirim sebagai "").
 * Bila `pattern` diberikan, nilai yang terisi harus cocok dengan pola itu.
 */
export const optionalString = (
  max = 255,
  { pattern, message = 'format tidak valid', lowercase = false } = {},
) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? (lowercase ? v.toLowerCase() : v) : null))
    .refine((v) => v === null || !pattern || pattern.test(v), { message })

/** Email opsional: kosong menjadi `null`, terisi harus email valid (huruf kecil). */
export const optionalEmailField = () =>
  optionalString(255, { lowercase: true }).refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    {
      message: 'format email tidak valid',
    },
  )

/** String wajib yang harus cocok pola tertentu (mis. kode). */
export const patternField = (pattern, message, { min = 1, max = 255, lowercase = false } = {}) => {
  const base = lowercase ? z.string().trim().toLowerCase() : z.string().trim()
  return base.min(min).max(max).regex(pattern, message)
}

/** ID opsional (UUID dari Select): kosong menjadi `null`. */
export const optionalId = () =>
  z
    .string()
    .nullish()
    .transform((v) => v || null)

/** Tanggal wajib 'YYYY-MM-DD' (nilai dari FormDatePicker). */
export const dateField = () =>
  z
    .string({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .min(1)
    .refine(isISODate, { message: 'tanggal tidak valid' })

/** Tanggal opsional: kosong menjadi `null`. */
export const optionalDateField = () =>
  z
    .string()
    .nullish()
    .transform((v) => v || null)
    .refine((v) => v === null || isISODate(v), { message: 'tanggal tidak valid' })

export { z }
