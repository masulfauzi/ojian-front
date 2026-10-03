export const DIFFICULTY_OPTIONS = [
  { value: 1, label: 'Mudah', severity: 'success' },
  { value: 2, label: 'Sedang', severity: 'info' },
  { value: 3, label: 'Sulit', severity: 'danger' },
]
export const difficultyOf = (value) => DIFFICULTY_OPTIONS.find((d) => d.value === value) ?? null

export const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Pribadi',
    icon: 'pi pi-lock',
    hint: 'Hanya Anda (dan admin sekolah)',
  },
  {
    value: 'school',
    label: 'Sekolah',
    icon: 'pi pi-users',
    hint: 'Guru lain di sekolah bisa melihat dan menyalin',
  },
]
export const visibilityOf = (value) => VISIBILITY_OPTIONS.find((v) => v.value === value) ?? null

/** Level kognitif (taksonomi Bloom revisi) yang umum dipakai. */
export const COGNITIVE_LEVELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((value) => ({
  value,
  label: value,
}))
