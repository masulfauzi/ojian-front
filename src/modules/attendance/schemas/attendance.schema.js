import { dateField, optionalString, z } from '@/shared/schemas/common'
import { isValidCoordinate } from '@/shared/utils/geo'

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const timeField = () => z.string({ required_error: 'wajib diisi' }).regex(HHMM, 'format jam HH:MM')
const intField = (min, max) =>
  z
    .number({ required_error: 'wajib diisi', invalid_type_error: 'wajib diisi' })
    .int()
    .min(min)
    .max(max)

/** 'HH:MM' → menit sejak tengah malam. */
export const minutesOf = (hhmm) => {
  const [h, m] = (hhmm ?? '').split(':').map(Number)
  return h * 60 + m
}

export const settingsSchema = z
  .object({
    opensAt: timeField(),
    onTimeUntil: timeField(),
    closesAt: timeField(),
    workDays: z.array(z.number().int().min(1).max(7)).min(1, 'pilih minimal satu hari'),
    requireSelfie: z.boolean(),
    selfieRetentionDays: intField(7, 365),
    geofenceMode: z.enum(['off', 'flag', 'enforce']),
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
    geofenceRadiusM: z.number().int().min(10).max(5000).nullish(),
    maxGpsAccuracyM: intField(10, 1000),
    leaveProofRequired: z.boolean(),
    leaveMaxDays: intField(1, 90),
    leaveBackdateDays: intField(0, 30),
  })
  .superRefine((v, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (
      HHMM.test(v.opensAt) &&
      HHMM.test(v.onTimeUntil) &&
      minutesOf(v.opensAt) >= minutesOf(v.onTimeUntil)
    )
      issue('onTimeUntil', 'harus setelah jam buka')
    if (
      HHMM.test(v.onTimeUntil) &&
      HHMM.test(v.closesAt) &&
      minutesOf(v.onTimeUntil) > minutesOf(v.closesAt)
    )
      issue('closesAt', 'tidak boleh sebelum batas tepat waktu')
    if (v.geofenceMode !== 'off') {
      if (!isValidCoordinate(v.latitude, v.longitude))
        issue('latitude', 'pilih titik sekolah di peta atau isi koordinat')
      if (!v.geofenceRadiusM) issue('geofenceRadiusM', 'wajib diisi (10–5000 m)')
    }
  })

export const leaveSchema = z
  .object({
    leaveType: z.enum(['sick', 'permission'], { required_error: 'wajib diisi' }),
    startDate: dateField(),
    endDate: dateField(),
    reason: z.string().trim().min(3).max(1000),
    mediaIds: z.array(z.string()).max(3, 'maksimal 3 berkas'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'tidak boleh sebelum tanggal mulai',
  })

export const holidaySchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    startDate: dateField(),
    endDate: dateField(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'tidak boleh sebelum tanggal mulai',
  })

export const correctionSchema = z
  .object({
    status: z.enum(['present', 'late', 'excused', 'sick', 'absent'], {
      required_error: 'wajib diisi',
    }),
    lateMinutes: z.number().int().min(1).max(1440).nullish(),
    reason: z.string().trim().min(3).max(1000),
    note: optionalString(1000),
  })
  .refine((v) => v.status !== 'late' || (v.lateMinutes ?? 0) >= 1, {
    path: ['lateMinutes'],
    message: 'wajib diisi untuk status terlambat',
  })
