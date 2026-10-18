// Kode error domain jurnal/jadwal (`ApiError.code`) → field form. Pesan sudah dari server.

const FIELDS = {
  JOURNAL_DATE_FUTURE: 'journalDate',
  JOURNAL_DATE_TOO_OLD: 'journalDate',
  JOURNAL_DATE_OUTSIDE_SEMESTER: 'journalDate',
  NOT_SCHOOL_DAY: 'journalDate',
  JOURNAL_PERIOD_INVALID: 'periodFrom',
  JOURNAL_PERIOD_OVERLAP: 'periodFrom',
  CLASS_NOT_IN_SEMESTER: 'classId',
  SCHEDULE_OVERLAP: 'periodFrom',
}

/** Untuk `useServerErrors` statusFields (409/422). */
export const fieldForCode = (error) => FIELDS[error?.code] ?? null
