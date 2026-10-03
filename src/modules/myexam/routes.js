const meta = (title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'my_exams',
  title,
  ...extra,
})

export default [
  {
    path: '/my-exams',
    name: 'my-exams',
    component: () => import('./views/MyExamListPage.vue'),
    meta: meta('Ujian Saya'),
  },
  {
    // Layar ujian penuh: tanpa sidebar/topbar dashboard.
    path: '/my-exams/attempt/:id',
    name: 'attempt',
    component: () => import('./views/AttemptPage.vue'),
    meta: meta('Mengerjakan Ujian', { layout: 'blank' }),
  },
  {
    path: '/my-exams/attempt/:id/result',
    name: 'attempt-result',
    component: () => import('./views/AttemptResultPage.vue'),
    meta: meta('Hasil Ujian'),
  },
]
