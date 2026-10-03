const meta = (title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'exams',
  title,
  ...extra,
})

export default [
  {
    path: '/exams',
    name: 'exams',
    component: () => import('./views/ExamListPage.vue'),
    meta: meta('Paket Ujian'),
  },
  {
    path: '/exams/:id',
    name: 'exam-detail',
    component: () => import('./views/ExamDetailPage.vue'),
    meta: meta('Detail Paket Ujian'),
  },
]
