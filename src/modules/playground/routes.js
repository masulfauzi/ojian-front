// Hanya didaftarkan saat development; pada build produksi array ini kosong dan halaman
// playground (beserta dependensinya) tidak ikut ter-bundle.
export default import.meta.env.DEV
  ? [
      {
        path: '/dev/playground',
        name: 'playground',
        component: () => import('./views/PlaygroundPage.vue'),
        meta: { layout: 'blank', requiresAuth: false, title: 'Playground' },
      },
    ]
  : []
