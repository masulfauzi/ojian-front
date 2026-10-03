const meta = (title) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode: 'exam_monitor',
  title,
})

export default [
  {
    path: '/exam-monitor',
    name: 'monitors',
    component: () => import('./views/MonitorListPage.vue'),
    meta: meta('Pemantauan Ujian'),
  },
  {
    path: '/exam-monitor/:id',
    name: 'monitor',
    component: () => import('./views/MonitorPage.vue'),
    meta: meta('Pemantauan Ujian'),
  },
]
