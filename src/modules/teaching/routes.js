const meta = (menuCode, title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode,
  title,
  ...extra,
})

// Nama route diberi awalan `teaching-`/`journal-`: `schedules` sudah dipakai jadwal ujian.
export default [
  {
    path: '/journals',
    name: 'journals',
    component: () => import('./views/MyJournalsPage.vue'),
    meta: meta('my_journals', 'Jurnal Mengajar'),
  },
  {
    path: '/my-schedule',
    name: 'my-teaching-schedule',
    component: () => import('./views/MySchedulePage.vue'),
    meta: meta('my_schedule', 'Jadwal Mengajar'),
  },
  {
    path: '/journal-reports',
    name: 'journal-reports',
    component: () => import('./views/JournalReportsPage.vue'),
    meta: meta('journal_reports', 'Rekap Jurnal'),
  },
  {
    path: '/schedules',
    name: 'teaching-schedules',
    component: () => import('./views/TeachingSchedulesPage.vue'),
    meta: meta('teaching_schedules', 'Jadwal Guru'),
  },
  {
    path: '/journal-settings',
    name: 'journal-settings',
    component: () => import('./views/JournalSettingsPage.vue'),
    meta: meta('journal_settings', 'Pengaturan Jurnal'),
  },
]
