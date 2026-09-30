export const EDUCATION_LEVELS = ['SD', 'SMP', 'SMA', 'SMK', 'MI', 'MTS', 'MA', 'LAINNYA']

export const EDUCATION_LEVEL_LABELS = {
  SD: 'SD',
  SMP: 'SMP',
  SMA: 'SMA',
  SMK: 'SMK',
  MI: 'MI',
  MTS: 'MTs',
  MA: 'MA',
  LAINNYA: 'Lainnya',
}

export const EDUCATION_LEVEL_OPTIONS = EDUCATION_LEVELS.map((value) => ({
  value,
  label: EDUCATION_LEVEL_LABELS[value],
}))

export const OWNERSHIP_OPTIONS = [
  { value: 'negeri', label: 'Negeri' },
  { value: 'swasta', label: 'Swasta' },
]
