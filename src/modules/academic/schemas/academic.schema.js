import { dateField, z } from '@/shared/schemas/common'

// Tanggal 'YYYY-MM-DD' bisa dibandingkan sebagai string.
const before = (a, b) => a && b && a < b
const within = (date, start, end) => date && start && end && date >= start && date <= end

const yearNameField = () =>
  z
    .string()
    .trim()
    .min(1)
    .regex(/^\d{4}\/\d{4}$/, 'format YYYY/YYYY, mis. 2026/2027')
    .refine((name) => {
      const [a, b] = name.split('/').map(Number)
      return b === a + 1
    }, 'tahun kedua harus satu tahun setelah tahun pertama')

const issue = (ctx, path, message) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })

function yearRangeRule(v, ctx) {
  if (!before(v.startDate, v.endDate)) issue(ctx, 'endDate', 'harus setelah tanggal mulai')
}

/** Tahun pelajaran baru beserta tanggal semester Ganjil dan Genap. */
export const createYearSchema = z
  .object({
    name: yearNameField(),
    startDate: dateField(),
    endDate: dateField(),
    ganjilStart: dateField(),
    ganjilEnd: dateField(),
    genapStart: dateField(),
    genapEnd: dateField(),
  })
  .superRefine((v, ctx) => {
    yearRangeRule(v, ctx)
    if (!before(v.ganjilStart, v.ganjilEnd)) issue(ctx, 'ganjilEnd', 'harus setelah tanggal mulai')
    if (!before(v.genapStart, v.genapEnd)) issue(ctx, 'genapEnd', 'harus setelah tanggal mulai')
    for (const field of ['ganjilStart', 'ganjilEnd', 'genapStart', 'genapEnd']) {
      if (!within(v[field], v.startDate, v.endDate)) {
        issue(ctx, field, 'harus di dalam rentang tahun pelajaran')
      }
    }
    if (!before(v.ganjilEnd, v.genapStart)) {
      issue(ctx, 'genapStart', 'semester Genap harus dimulai setelah Ganjil berakhir')
    }
  })

/** Ubah nama dan rentang tahun pelajaran (rentang baru harus memuat kedua semester). */
export const updateYearSchema = ({ semesters = [] } = {}) =>
  z
    .object({ name: yearNameField(), startDate: dateField(), endDate: dateField() })
    .superRefine((v, ctx) => {
      yearRangeRule(v, ctx)
      const first = semesters.reduce(
        (min, s) => (!min || s.startDate < min ? s.startDate : min),
        null,
      )
      const last = semesters.reduce((max, s) => (!max || s.endDate > max ? s.endDate : max), null)
      if (first && v.startDate > first)
        issue(ctx, 'startDate', 'harus memuat tanggal mulai semester Ganjil')
      if (last && v.endDate < last)
        issue(ctx, 'endDate', 'harus memuat tanggal selesai semester Genap')
    })

/** Ubah tanggal semester: di dalam rentang tahun pelajaran dan tidak beririsan dengan semester lain. */
export const semesterDatesSchema = ({ year = null, other = null } = {}) =>
  z.object({ startDate: dateField(), endDate: dateField() }).superRefine((v, ctx) => {
    if (!before(v.startDate, v.endDate)) issue(ctx, 'endDate', 'harus setelah tanggal mulai')
    if (year) {
      if (!within(v.startDate, year.startDate, year.endDate)) {
        issue(ctx, 'startDate', 'harus di dalam rentang tahun pelajaran')
      }
      if (!within(v.endDate, year.startDate, year.endDate)) {
        issue(ctx, 'endDate', 'harus di dalam rentang tahun pelajaran')
      }
    }
    if (other && v.startDate <= other.endDate && v.endDate >= other.startDate) {
      issue(ctx, 'startDate', `beririsan dengan semester ${other.termName}`)
    }
  })
