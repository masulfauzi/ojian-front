export default [
  {
    path: '/schools',
    name: 'schools',
    component: () => import('./views/SchoolListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'schools', title: 'Sekolah' },
  },
]
