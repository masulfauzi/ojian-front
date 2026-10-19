// Tiga alur kerja yang ditampilkan sebagai lini masa.

export const WORKFLOWS = [
  {
    id: 'alur-ujian',
    icon: 'pi pi-file-edit',
    title: 'Ujian',
    steps: [
      {
        id: 'alur-ujian-1',
        title: 'Susun bank soal',
        summary: 'Guru menulis soal lengkap dengan kunci dan pembahasan.',
      },
      {
        id: 'alur-ujian-2',
        title: 'Buat paket ujian',
        summary: 'Pilih soal aktif, susun per bagian, dan atur bobot.',
      },
      {
        id: 'alur-ujian-3',
        title: 'Jadwalkan',
        summary: 'Tentukan kelas, waktu, pengacakan, dan token bila perlu.',
      },
      {
        id: 'alur-ujian-4',
        title: 'Siswa mengerjakan',
        summary: 'Jawaban tersimpan otomatis dengan waktu dari server.',
      },
      {
        id: 'alur-ujian-5',
        title: 'Penilaian dan analisis',
        summary: 'Nilai otomatis, uraian dinilai guru, dan analisis butir soal.',
      },
      {
        id: 'alur-ujian-6',
        title: 'Rekap dan remedial',
        summary: 'Lihat ketuntasan KKM dan buat jadwal remedial.',
      },
    ],
  },
  {
    id: 'alur-presensi',
    icon: 'pi pi-camera',
    title: 'Presensi dan izin',
    steps: [
      {
        id: 'alur-presensi-1',
        title: 'Siswa selfie di pagi hari',
        summary: 'Presensi dari ponsel dalam jam yang diatur sekolah.',
      },
      {
        id: 'alur-presensi-2',
        title: 'Status tercatat otomatis',
        summary: 'Hadir atau terlambat ditentukan jam server.',
      },
      {
        id: 'alur-presensi-3',
        title: 'Bila berhalangan, ajukan izin',
        summary: 'Siswa memilih tanggal dan melampirkan bukti.',
      },
      {
        id: 'alur-presensi-4',
        title: 'Admin presensi menyetujui',
        summary: 'Izin disetujui atau ditolak dengan alasan.',
      },
      {
        id: 'alur-presensi-5',
        title: 'Izin tercatat otomatis',
        summary: 'Hari izin masuk ke rekap tanpa input ulang.',
      },
      {
        id: 'alur-presensi-6',
        title: 'Lihat rekap bulanan',
        summary: 'Siswa dan wali kelas memantau kehadiran.',
      },
    ],
  },
  {
    id: 'alur-jurnal',
    icon: 'pi pi-book',
    title: 'Jurnal dan jadwal',
    steps: [
      {
        id: 'alur-jurnal-1',
        title: 'Isi jurnal setelah mengajar',
        summary: 'Catat kelas, mata pelajaran, jam ke, dan materi.',
      },
      {
        id: 'alur-jurnal-2',
        title: 'Lihat siswa dan kehadirannya',
        summary: 'Status presensi pagi siswa kelas itu pada tanggal jurnal.',
      },
      {
        id: 'alur-jurnal-3',
        title: 'Ekspor laporan Excel',
        summary: 'Laporan siap cetak dengan blok tanda tangan.',
      },
      {
        id: 'alur-jurnal-4',
        title: 'Bentuk jadwal dari jurnal',
        summary: 'Pola jurnal yang berulang menjadi slot jadwal.',
      },
      {
        id: 'alur-jurnal-5',
        title: 'Koreksi dan kunci jadwal',
        summary: 'Perbaiki slot manual dan kunci yang sudah benar.',
      },
    ],
  },
]
