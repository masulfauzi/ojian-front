// Kode error domain presensi/izin dari backend (`ApiError.code`) → field form yang relevan.
// Pesan sudah dalam bahasa Indonesia dari server, jadi yang dipetakan hanya letak tampilnya.

const CHECKIN_FIELDS = {
  LOCATION_REQUIRED: 'location',
  LOCATION_INACCURATE: 'location',
  OUTSIDE_GEOFENCE: 'location',
  SELFIE_REQUIRED: 'selfie',
  SELFIE_DUPLICATE: 'selfie',
  INVALID_IMAGE: 'selfie',
  FILE_TOO_LARGE: 'selfie',
  UNSUPPORTED_FILE_TYPE: 'selfie',
}

const LEAVE_FIELDS = {
  LEAVE_NO_SCHOOL_DAY: 'startDate',
  LEAVE_RANGE_TOO_LONG: 'endDate',
  LEAVE_BACKDATE_EXCEEDED: 'startDate',
  LEAVE_OVERLAP: 'startDate',
  LEAVE_PROOF_REQUIRED: 'mediaIds',
}

/** Bagian panel presensi tempat error ditampilkan: 'location' | 'selfie' | null (umum). */
export const checkInErrorField = (error) => CHECKIN_FIELDS[error?.code] ?? null

/** Field form izin untuk error domain (dipakai `useServerErrors` statusFields). */
export const leaveErrorField = (error) => LEAVE_FIELDS[error?.code] ?? null

/** Kode yang berarti keadaan hari ini berubah (muat ulang kartu presensi). */
export const STATE_CODES = [
  'NOT_SCHOOL_DAY',
  'NO_CLASS',
  'ATTENDANCE_NOT_OPEN',
  'ATTENDANCE_CLOSED',
]
