export default [
  {
    path: '/students',
    name: 'students',
    component: () => import('./views/StudentListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'students', title: 'Siswa' },
  },
]
