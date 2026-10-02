// Public API modul school.
export { default as SchoolSelect } from './components/SchoolSelect.vue'
export { useSchoolNames } from './composables/useSchoolNames'
export { getSchool, listSchools } from './api/school.api'
export { EDUCATION_LEVEL_LABELS, EDUCATION_LEVEL_OPTIONS, OWNERSHIP_OPTIONS } from './constants'
