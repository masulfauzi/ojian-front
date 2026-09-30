export default [
  {
    path: '/users',
    name: 'users',
    component: () => import('./views/UserListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'users', title: 'Pengguna' },
  },
]
