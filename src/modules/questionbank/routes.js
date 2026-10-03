const meta = (title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'question_bank',
  title,
  ...extra,
})

export default [
  {
    path: '/question-bank',
    name: 'question-bank',
    component: () => import('./views/QuestionListPage.vue'),
    meta: meta('Bank Soal'),
  },
  {
    path: '/question-bank/new',
    name: 'question-new',
    component: () => import('./views/QuestionFormPage.vue'),
    meta: meta('Tambah Soal', { action: 'create' }),
  },
  {
    path: '/question-bank/stimuli',
    name: 'stimuli',
    component: () => import('./views/StimulusListPage.vue'),
    meta: meta('Teks Bacaan'),
  },
  {
    path: '/question-bank/:id',
    name: 'question-detail',
    component: () => import('./views/QuestionDetailPage.vue'),
    meta: meta('Detail Soal'),
  },
  {
    path: '/question-bank/:id/edit',
    name: 'question-edit',
    component: () => import('./views/QuestionFormPage.vue'),
    meta: meta('Ubah Soal', { action: 'update' }),
  },
]
