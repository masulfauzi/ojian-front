// Halaman sistem. Route catch-all otomatis dipasang paling akhir oleh app/router.
export default [
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('./views/ForbiddenPage.vue'),
    meta: { layout: 'blank', requiresAuth: false, title: 'Akses ditolak' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/NotFoundPage.vue'),
    meta: { layout: 'blank', requiresAuth: false, title: 'Halaman tidak ditemukan' },
  },
]
