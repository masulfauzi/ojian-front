// Enam pilar platform dan fiturnya. Teks murni (tanpa HTML).
// status: 'available' (sudah ada di aplikasi) | 'coming_soon' (diberi label "Segera hadir").
// routePath: rute aplikasi tempat fitur berada; test memastikan rute fitur `available` memang ada.

export const PILLARS = [
  {
    id: 'ujian-online',
    icon: 'pi pi-file-edit',
    title: 'Ujian Online',
    tagline: 'Dari bank soal sampai hasil, dalam satu alur.',
    features: [
      {
        id: 'ujian-bank-soal',
        title: 'Bank soal berversi',
        summary:
          'Soal disimpan per sekolah dan bisa dibagikan antarguru di sekolah yang sama. Soal yang sudah dipakai ujian tidak berubah nilainya walau diedit.',
        status: 'available',
        routePath: '/question-bank',
      },
      {
        id: 'ujian-jenis-soal',
        title: 'Beragam jenis soal',
        summary:
          'Dari pilihan ganda sampai melengkapi rumpang, dengan beberapa jenis lagi yang segera hadir. Lihat bagian Jenis Soal.',
        status: 'available',
        routePath: '/question-bank',
      },
      {
        id: 'ujian-stimulus',
        title: 'Teks bacaan, gambar, dan rumus',
        summary:
          'Satu teks bacaan untuk beberapa soal, gambar pada soal dan opsi, serta rumus matematika.',
        status: 'available',
        routePath: '/question-bank',
      },
      {
        id: 'ujian-paket',
        title: 'Paket ujian yang bisa dipakai ulang',
        summary:
          'Satu paket dijadwalkan berkali-kali: ujian utama, susulan, remedial, atau per gelombang.',
        status: 'available',
        routePath: '/exams',
      },
      {
        id: 'ujian-jadwal',
        title: 'Jadwal ujian',
        summary:
          'Atur waktu, durasi, kelas peserta, peserta tambahan, dan tambahan waktu per siswa.',
        status: 'available',
        routePath: '/exam-schedules',
      },
      {
        id: 'ujian-acak',
        title: 'Acak soal dan opsi',
        summary:
          'Urutan soal dan opsi diacak per siswa. Bagian soal tidak tercampur dan soal satu teks bacaan tetap berurutan.',
        status: 'available',
        routePath: '/exam-schedules',
      },
      {
        id: 'ujian-token',
        title: 'Token ujian',
        summary:
          'Opsional: token tetap atau berganti otomatis tiap beberapa menit, hanya diminta saat memulai.',
        status: 'available',
        routePath: '/exam-schedules',
      },
      {
        id: 'ujian-pengerjaan',
        title: 'Pengerjaan yang aman',
        summary:
          'Jawaban tersimpan otomatis, waktu dihitung server, dan satu pengerjaan aktif per siswa.',
        status: 'available',
        routePath: '/my-exams',
      },
      {
        id: 'ujian-penilaian',
        title: 'Penilaian otomatis dan manual',
        summary:
          'Nilai otomatis termasuk nilai parsial. Uraian dinilai guru dengan rubrik, dan jawaban isian yang perlu diperiksa masuk antrean penilaian guru.',
        status: 'available',
        routePath: '/exam-results',
      },
      {
        id: 'ujian-hasil',
        title: 'Hasil, KKM, dan remedial',
        summary: 'Rekap nilai, ambang KKM, dan jadwal remedial untuk siswa yang belum tuntas.',
        status: 'available',
        routePath: '/exam-results',
      },
      {
        id: 'ujian-analisis',
        title: 'Analisis butir soal',
        summary:
          'Sebaran pilihan jawaban dan tingkat kesukaran, serta koreksi kunci dengan nilai ulang otomatis.',
        status: 'available',
        routePath: '/exam-results',
      },
      {
        id: 'ujian-pemantauan',
        title: 'Pemantauan ujian',
        summary:
          'Pengawas memantau status peserta, melihat token, menambah waktu, dan mengumpulkan paksa.',
        status: 'available',
        routePath: '/exam-monitor',
      },
    ],
  },
  {
    id: 'presensi-siswa',
    icon: 'pi pi-camera',
    title: 'Presensi Siswa',
    tagline: 'Presensi dari ponsel, rekap otomatis.',
    features: [
      {
        id: 'presensi-selfie',
        title: 'Presensi selfie sekali sehari',
        summary: 'Siswa presensi dari ponsel setiap pagi dengan foto selfie.',
        status: 'available',
        routePath: '/my-attendance',
      },
      {
        id: 'presensi-jam',
        title: 'Jam presensi dan status otomatis',
        summary:
          'Sekolah mengatur jam buka, batas tepat waktu, dan jam tutup. Status hadir atau terlambat ditentukan jam server.',
        status: 'available',
        routePath: '/attendance/settings',
      },
      {
        id: 'presensi-lokasi',
        title: 'Verifikasi lokasi (opsional)',
        summary: 'Mati, hanya ditandai, atau wajib berada dalam radius sekolah.',
        status: 'available',
        routePath: '/attendance/settings',
      },
      {
        id: 'presensi-izin',
        title: 'Izin dan sakit online',
        summary: 'Siswa memilih rentang tanggal dan mengunggah bukti berupa foto atau PDF.',
        status: 'available',
        routePath: '/my-leaves',
      },
      {
        id: 'presensi-persetujuan',
        title: 'Persetujuan admin presensi',
        summary:
          'Admin menyetujui atau menolak dengan alasan. Izin yang disetujui otomatis tercatat di rekap.',
        status: 'available',
        routePath: '/attendance/leaves',
      },
      {
        id: 'presensi-rekap',
        title: 'Rekap bulanan',
        summary:
          'Siswa melihat rekap bulanannya. Admin dan wali kelas melihat rekap kelas dan sekolah.',
        status: 'available',
        routePath: '/my-attendance',
      },
      {
        id: 'presensi-koreksi',
        title: 'Koreksi dan alpa otomatis',
        summary:
          'Siswa yang tidak presensi dan tidak punya izin otomatis dicatat alpa. Koreksi manual wajib beralasan dan tercatat riwayatnya.',
        status: 'available',
        routePath: '/attendance',
      },
      {
        id: 'presensi-libur',
        title: 'Hari libur dan kalender',
        summary: 'Hari libur sekolah tidak dihitung sebagai hari presensi.',
        status: 'available',
        routePath: '/holidays',
      },
      {
        id: 'presensi-foto',
        title: 'Foto yang dijaga',
        summary:
          'Foto disimpan privat, aksesnya terbatas, dan dihapus otomatis setelah masa simpan yang diatur sekolah.',
        status: 'available',
        routePath: '/attendance/settings',
      },
    ],
  },
  {
    id: 'jurnal-mengajar',
    icon: 'pi pi-book',
    title: 'Jurnal Mengajar',
    tagline: 'Catat sekali, jadi laporan dan jadwal.',
    features: [
      {
        id: 'jurnal-sesi',
        title: 'Jurnal per sesi mengajar',
        summary:
          'Guru mencatat tanggal, jam ke berapa sampai berapa, kelas, mata pelajaran, dan materi.',
        status: 'available',
        routePath: '/journals',
      },
      {
        id: 'jurnal-semester',
        title: 'Berbasis semester',
        summary:
          'Berpindah semester untuk melihat jurnal sebelumnya. Jurnal lama otomatis terkunci setelah batas hari yang diatur sekolah.',
        status: 'available',
        routePath: '/journals',
      },
      {
        id: 'jurnal-kehadiran',
        title: 'Kehadiran siswa dari jurnal',
        summary:
          'Dari sebuah jurnal, guru melihat siswa kelas itu beserta status presensi pagi pada tanggal tersebut.',
        status: 'available',
        routePath: '/journals',
      },
      {
        id: 'jurnal-ringkasan',
        title: 'Ringkasan jam mengajar',
        summary: 'Total pertemuan dan jam pelajaran per bulan, kelas, dan mata pelajaran.',
        status: 'available',
        routePath: '/journals',
      },
      {
        id: 'jurnal-excel',
        title: 'Laporan Excel siap cetak',
        summary:
          'Ekspor ke Excel dengan identitas, rekap, dan blok tanda tangan untuk laporan ke atasan.',
        status: 'available',
        routePath: '/journals',
      },
      {
        id: 'jurnal-jadwal-otomatis',
        title: 'Jadwal otomatis dari jurnal',
        summary:
          'Jadwal mengajar dibentuk dari pola jurnal yang sudah ada, dengan pratinjau, koreksi manual, dan kunci slot.',
        status: 'available',
        routePath: '/my-schedule',
      },
      {
        id: 'jurnal-jadwal-guru',
        title: 'Jadwal guru dan kelas',
        summary: 'Admin melihat jadwal per guru dan per kelas, serta rekap jurnal seluruh guru.',
        status: 'available',
        routePath: '/schedules',
      },
    ],
  },
  {
    id: 'akademik',
    icon: 'pi pi-building',
    title: 'Akademik dan Data Sekolah',
    tagline: 'Struktur sekolah yang rapi per tahun pelajaran.',
    features: [
      {
        id: 'akademik-tahun',
        title: 'Tahun pelajaran dan semester',
        summary: 'Ganjil dan genap per sekolah, dengan semester aktif.',
        status: 'available',
        routePath: '/academic-years',
      },
      {
        id: 'akademik-kelas',
        title: 'Kelas per tahun pelajaran',
        summary:
          'Nama kelas bebas ditentukan sekolah, dengan tingkat baku dan wali kelas. Kelas tahun sebelumnya bisa disalin sekaligus.',
        status: 'available',
        routePath: '/classes',
      },
      {
        id: 'akademik-siswa',
        title: 'Data siswa',
        summary: 'NIS, NISN, status siswa, dan akun login dibuat bersamaan.',
        status: 'available',
        routePath: '/students',
      },
      {
        id: 'akademik-naik-kelas',
        title: 'Riwayat kelas dan naik kelas',
        summary: 'Keanggotaan kelas per semester serta proses naik kelas dan kelulusan.',
        status: 'available',
        routePath: '/promotions',
      },
      {
        id: 'akademik-mapel',
        title: 'Mata pelajaran',
        summary: 'Daftar mata pelajaran per sekolah.',
        status: 'available',
        routePath: '/subjects',
      },
      {
        id: 'akademik-libur',
        title: 'Hari libur',
        summary: 'Kalender libur sekolah.',
        status: 'available',
        routePath: '/holidays',
      },
    ],
  },
  {
    id: 'pengguna-akses',
    icon: 'pi pi-shield',
    title: 'Pengguna, Peran, dan Hak Akses',
    tagline: 'Setiap orang hanya melihat yang menjadi haknya.',
    features: [
      {
        id: 'akses-peran',
        title: 'Banyak peran',
        summary:
          'Super Admin, Admin Sekolah, Guru, Siswa, dan Admin Presensi, ditambah peran kustom per sekolah.',
        status: 'available',
        routePath: '/roles',
      },
      {
        id: 'akses-menu',
        title: 'Hak akses per menu',
        summary: 'Atur lihat, tambah, ubah, dan hapus untuk tiap menu.',
        status: 'available',
        routePath: '/roles',
      },
      {
        id: 'akses-ganti-peran',
        title: 'Ganti peran aktif',
        summary:
          'Satu pengguna bisa memiliki beberapa peran dan berpindah peran. Menu mengikuti peran yang aktif.',
        status: 'available',
        routePath: '/dashboard',
      },
      {
        id: 'akses-menu-atur',
        title: 'Menu yang dapat diatur',
        summary: 'Daftar menu dan urutannya dikelola dari panel admin.',
        status: 'available',
        routePath: '/menus',
      },
      {
        id: 'akses-pengguna',
        title: 'Manajemen pengguna',
        summary: 'Admin membuat, mengubah, menonaktifkan, dan mencari pengguna.',
        status: 'available',
        routePath: '/users',
      },
    ],
  },
  {
    id: 'multi-sekolah',
    icon: 'pi pi-sitemap',
    title: 'Multi-Sekolah',
    tagline: 'Satu platform, data tiap sekolah terpisah.',
    features: [
      {
        id: 'multi-banyak',
        title: 'Banyak sekolah dalam satu platform',
        summary: 'Data tiap sekolah terpisah dan hanya terlihat oleh sekolah itu.',
        status: 'available',
        routePath: '/schools',
      },
      {
        id: 'multi-zona',
        title: 'Zona waktu per sekolah',
        summary: 'Jadwal dan presensi mengikuti WIB, WITA, atau WIT sesuai sekolah.',
        status: 'available',
        routePath: '/schools',
      },
      {
        id: 'multi-pengaturan',
        title: 'Pengaturan per sekolah',
        summary: 'Presensi, jurnal, hari libur, dan peran kustom diatur sendiri oleh tiap sekolah.',
        status: 'available',
        routePath: '/attendance/settings',
      },
    ],
  },
]
