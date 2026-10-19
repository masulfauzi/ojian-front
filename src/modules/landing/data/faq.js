// Pertanyaan umum. Jawaban hanya menyebut fakta yang tersedia; fitur yang belum ada disebut
// "segera hadir".

export const FAQ = [
  {
    id: 'faq-jenis-soal',
    question: 'Apa saja jenis soal yang didukung?',
    answer:
      'Pilihan ganda, pilihan ganda kompleks, benar/salah, benar/salah majemuk, menjodohkan, mengurutkan, pengelompokan, isian singkat, isian angka, melengkapi rumpang, dan uraian. Klik area pada gambar, unggah file, dan soal koding segera hadir.',
  },
  {
    id: 'faq-acak',
    question: 'Apakah soal dan opsi bisa diacak?',
    answer:
      'Bisa. Urutan soal dan urutan opsi diacak per siswa sesuai pengaturan jadwal. Bagian soal tidak tercampur, dan soal yang memakai teks bacaan yang sama tetap berurutan.',
  },
  {
    id: 'faq-token',
    question: 'Untuk apa token ujian?',
    answer:
      'Token memastikan siswa memulai ujian di bawah pengawasan. Token bisa tetap atau berganti otomatis tiap beberapa menit, dan hanya diminta saat memulai, bukan saat melanjutkan.',
  },
  {
    id: 'faq-presensi',
    question: 'Bagaimana siswa presensi dan apa yang terjadi bila terlambat?',
    answer:
      'Siswa membuka menu presensi di ponsel dan mengambil selfie dalam jam yang diatur sekolah. Presensi setelah batas tepat waktu tercatat terlambat beserta menitnya. Setelah jam tutup presensi tidak dapat dilakukan, dan siswa tanpa presensi atau izin tercatat alpa.',
  },
  {
    id: 'faq-izin',
    question: 'Bagaimana siswa mengajukan izin dan siapa yang menyetujui?',
    answer:
      'Siswa memilih jenis izin atau sakit, rentang tanggal, alasan, dan mengunggah bukti berupa foto atau PDF. Admin presensi menyetujui atau menolak dengan alasan, dan izin yang disetujui otomatis tercatat di rekap.',
  },
  {
    id: 'faq-foto',
    question: 'Apakah foto selfie disimpan selamanya?',
    answer:
      'Tidak. Foto disimpan privat dengan akses terbatas dan dihapus otomatis setelah masa simpan yang diatur sekolah.',
  },
  {
    id: 'faq-jadwal',
    question: 'Bagaimana jurnal mengajar menjadi jadwal?',
    answer:
      'Sistem membaca pola jurnal yang berulang, yaitu hari, jam ke, kelas, dan mata pelajaran yang sama, lalu menampilkan pratinjau jadwal. Guru atau admin menerapkannya, lalu dapat mengoreksi dan mengunci slot.',
  },
  {
    id: 'faq-cetak',
    question: 'Bisakah jurnal dicetak untuk laporan?',
    answer:
      'Bisa. Jurnal diekspor ke Excel lengkap dengan identitas, rekap per kelas dan mata pelajaran, serta blok tanda tangan kepala sekolah dan guru.',
  },
  {
    id: 'faq-sekolah',
    question: 'Apakah data antarsekolah tercampur?',
    answer:
      'Tidak. Setiap sekolah hanya melihat datanya sendiri, termasuk siswa, soal, ujian, presensi, dan jurnal.',
  },
  {
    id: 'faq-peran',
    question: 'Satu pengguna bisa punya beberapa peran?',
    answer:
      'Bisa. Misalnya seorang guru juga menjadi admin presensi. Pengguna berpindah peran aktif dari menu akun, dan menu yang tampil mengikuti peran yang aktif.',
  },
]
