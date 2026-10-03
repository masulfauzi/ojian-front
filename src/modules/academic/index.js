// Public API modul academic: konteks sekolah dan kalender akademik untuk modul kelas & siswa.
export { useSchoolContext } from './composables/useSchoolContext'
export { useAcademicCalendar } from './composables/useAcademicCalendar'
export { default as SchoolContextBar } from './components/SchoolContextBar.vue'
export { TERM_GANJIL, TERM_GENAP } from './api/academic.api'
export { semesterLabel } from './utils/dates'
