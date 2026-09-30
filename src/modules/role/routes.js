export default [
  {
    path: '/roles',
    name: 'roles',
    component: () => import('./views/RoleListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'roles', title: 'Role & Hak Akses' },
  },
  {
    path: '/roles/:id/permissions',
    name: 'role-permissions',
    component: () => import('./views/RolePermissionPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, menuCode: 'roles', title: 'Hak Akses Role' },
  },
]
