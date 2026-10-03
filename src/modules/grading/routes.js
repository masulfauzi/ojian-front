const meta = (title) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'exam_results',
  title,
})

export default [
  {
    path: '/exam-results',
    name: 'results',
    component: () => import('./views/ResultListPage.vue'),
    meta: meta('Hasil Ujian'),
  },
  {
    path: '/exam-results/:id',
    name: 'result',
    component: () => import('./views/ResultPage.vue'),
    meta: meta('Hasil Ujian'),
  },
]
