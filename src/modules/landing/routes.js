// Landing page publik di `/`. requiresAuth: false (bukan guestOnly): tidak menunggu pemulihan
// sesi dan tidak mengalihkan pengguna yang sudah login.
export default [
  {
    path: '/',
    name: 'landing',
    component: () => import('./views/LandingPage.vue'),
    meta: {
      layout: 'landing',
      requiresAuth: false,
      title: 'Ujian online, presensi, dan jurnal mengajar',
      description:
        'Platform sekolah terpadu: bank soal dan ujian online, presensi selfie dan izin online, jurnal mengajar dengan laporan Excel, serta data akademik dan hak akses per peran.',
    },
  },
]
