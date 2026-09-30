export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginPage.vue'),
    meta: { layout: 'auth', requiresAuth: false, guestOnly: true, title: 'Masuk' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/ProfilePage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, title: 'Profil' },
  },
]
