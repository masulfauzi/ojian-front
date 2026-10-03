export default [
  {
    path: '/academic-years',
    name: 'academic-years',
    component: () => import('./views/AcademicYearsPage.vue'),
    meta: {
      layout: 'dashboard',
      requiresAuth: true,
      menuCode: 'academic_years',
      title: 'Tahun Pelajaran & Semester',
    },
  },
]
