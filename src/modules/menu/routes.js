export default [
  {
    path: '/menus',
    name: 'menus',
    component: () => import('./views/MenuTreePage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'menus', title: 'Menu' },
  },
]
