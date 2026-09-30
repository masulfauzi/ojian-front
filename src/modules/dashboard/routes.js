export default [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./views/DashboardPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, title: 'Dashboard' },
  },
]
