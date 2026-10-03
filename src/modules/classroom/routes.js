export default [
  {
    path: '/classes',
    name: 'classes',
    component: () => import('./views/ClassListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'classes', title: 'Kelas' },
  },
  {
    // Statis lebih dulu dicocokkan daripada /classes/:id oleh vue-router.
    path: '/promotions',
    name: 'promotions',
    component: () => import('./views/PromotionPage.vue'),
    meta: {
      layout: 'dashboard',
      requiresAuth: true,
      menuCode: 'classes',
      action: 'update',
      title: 'Kenaikan Kelas',
    },
  },
  {
    path: '/classes/:id',
    name: 'class-detail',
    component: () => import('./views/ClassDetailPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'classes', title: 'Anggota Kelas' },
  },
]
