const meta = (title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'exam_schedules',
  title,
  ...extra,
})

export default [
  {
    path: '/exam-schedules',
    name: 'schedules',
    component: () => import('./views/ScheduleListPage.vue'),
    meta: meta('Jadwal Ujian'),
  },
  {
    path: '/exam-schedules/new',
    name: 'schedule-new',
    component: () => import('./views/ScheduleFormPage.vue'),
    meta: meta('Buat Jadwal Ujian', { action: 'create' }),
  },
  {
    path: '/exam-schedules/:id',
    name: 'schedule-detail',
    component: () => import('./views/ScheduleDetailPage.vue'),
    meta: meta('Detail Jadwal Ujian'),
  },
  {
    path: '/exam-schedules/:id/edit',
    name: 'schedule-edit',
    component: () => import('./views/ScheduleFormPage.vue'),
    meta: meta('Ubah Jadwal Ujian', { action: 'update' }),
  },
]
