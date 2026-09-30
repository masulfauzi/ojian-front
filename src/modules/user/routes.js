import { ROLE_ADMIN } from '@/modules/auth'

export default [
  {
    path: '/users',
    name: 'users',
    component: () => import('./views/UserListPage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, roles: [ROLE_ADMIN], title: 'Manajemen User' },
  },
]
