export default [
  {
    // Registrasi mandiri: sekolah baru + akun admin sekolahnya, lalu langsung masuk.
    path: '/register-school',
    name: 'register-school',
    component: () => import('./views/RegisterSchoolPage.vue'),
    meta: {
      layout: 'auth',
      requiresAuth: false,
      guestOnly: true,
      wide: true,
      title: 'Registrasi Sekolah',
    },
  },
]
