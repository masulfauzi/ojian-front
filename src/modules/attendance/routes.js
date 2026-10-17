const meta = (menuCode, title, extra = {}) => ({
  layout: 'dashboard',
  requiresAuth: true,
  menuCode,
  title,
  ...extra,
})

export default [
  {
    path: '/my-attendance',
    name: 'my-attendance',
    component: () => import('./views/MyAttendancePage.vue'),
    meta: meta('my_attendance', 'Presensi Saya'),
  },
  {
    path: '/my-leaves',
    name: 'my-leaves',
    component: () => import('./views/MyLeavesPage.vue'),
    meta: meta('my_leaves', 'Izin Saya'),
  },
  {
    path: '/attendance',
    name: 'attendance-records',
    component: () => import('./views/AttendanceRecordsPage.vue'),
    meta: meta('attendance_records', 'Data Presensi'),
  },
  {
    path: '/attendance/leaves',
    name: 'attendance-leaves',
    component: () => import('./views/LeaveApprovalPage.vue'),
    meta: meta('attendance_leaves', 'Persetujuan Izin'),
  },
  {
    path: '/attendance/reports',
    name: 'attendance-reports',
    component: () => import('./views/AttendanceReportsPage.vue'),
    meta: meta('attendance_reports', 'Rekap Presensi'),
  },
  {
    path: '/attendance/settings',
    name: 'attendance-settings',
    component: () => import('./views/AttendanceSettingsPage.vue'),
    meta: meta('attendance_settings', 'Pengaturan Presensi'),
  },
  {
    path: '/holidays',
    name: 'holidays',
    component: () => import('./views/HolidayListPage.vue'),
    meta: meta('school_holidays', 'Hari Libur'),
  },
]
