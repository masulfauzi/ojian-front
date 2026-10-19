// Kemampuan tiap peran sistem.

export const ROLES = [
  {
    id: 'peran-siswa',
    icon: 'pi pi-user',
    title: 'Siswa',
    abilities: [
      'Mengerjakan ujian, dengan token bila diminta',
      'Presensi selfie setiap pagi',
      'Mengajukan izin atau sakit dengan bukti',
      'Melihat rekap presensi bulanan',
      'Melihat hasil ujian sesuai pengaturan',
    ],
  },
  {
    id: 'peran-guru',
    icon: 'pi pi-id-card',
    title: 'Guru',
    abilities: [
      'Menyusun bank soal dan paket ujian',
      'Menjadwalkan dan memantau ujian',
      'Menilai jawaban uraian',
      'Mengisi jurnal mengajar dan melihat kehadiran siswa dari jurnal',
      'Mengekspor laporan Excel dan membentuk jadwal mengajar',
      'Wali kelas melihat rekap presensi kelasnya',
    ],
  },
  {
    id: 'peran-admin-presensi',
    icon: 'pi pi-check-square',
    title: 'Admin Presensi',
    abilities: [
      'Menyetujui atau menolak izin',
      'Mengoreksi data presensi',
      'Melihat rekap presensi',
      'Mengelola hari libur',
    ],
  },
  {
    id: 'peran-admin-sekolah',
    icon: 'pi pi-building',
    title: 'Admin Sekolah',
    abilities: [
      'Mengelola pengguna, siswa, kelas, tahun pelajaran, semester, dan mata pelajaran',
      'Mengatur peran kustom dan hak akses',
      'Mengatur presensi dan jurnal',
      'Melihat rekap jurnal dan jadwal guru',
    ],
  },
  {
    id: 'peran-super-admin',
    icon: 'pi pi-shield',
    title: 'Super Admin',
    abilities: ['Mengelola sekolah', 'Mengelola menu', 'Mengelola peran sistem lintas sekolah'],
  },
]
