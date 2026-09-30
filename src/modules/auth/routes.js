export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginPage.vue'),
    meta: { layout: 'auth', requiresAuth: false, guestOnly: true, title: 'Masuk' },
  },
  {
    // Wajib dibuka lebih dulu bila akun masih memakai password awal dari admin.
    path: '/change-password',
    name: 'change-password',
    component: () => import('./views/ChangePasswordRequiredPage.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: true,
      allowWhenMustChange: true,
      title: 'Ganti password',
    },
  },
  {
    // Tanpa menuCode: setiap pengguna yang login boleh membuka profilnya.
    path: '/profile',
    name: 'profile',
    component: () => import('./views/ProfilePage.vue'),
    meta: { layout: 'dashboard', requiresAuth: true, title: 'Profil' },
  },
]
