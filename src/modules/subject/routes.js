export default [
  {
    path: '/subjects',
    name: 'subjects',
    component: () => import('./views/SubjectListPage.vue'),
    meta: {
      layout: 'dashboard',
      requiresAuth: true,
      menuCode: 'subjects',
      title: 'Mata Pelajaran',
    },
  },
]
