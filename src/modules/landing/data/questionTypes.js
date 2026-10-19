// Jenis soal yang ditampilkan di landing. Status mengikuti jenis yang aktif di aplikasi
// (registri `questionbank/types/definitions.js`).

export const QUESTION_TYPES = [
  {
    id: 'soal-pg',
    icon: 'pi pi-circle',
    title: 'Pilihan Ganda',
    summary: 'Satu jawaban benar dari beberapa pilihan.',
    status: 'available',
  },
  {
    id: 'soal-pg-kompleks',
    icon: 'pi pi-check-square',
    title: 'Pilihan Ganda Kompleks',
    summary: 'Lebih dari satu jawaban benar, dengan nilai parsial.',
    status: 'available',
  },
  {
    id: 'soal-benar-salah',
    icon: 'pi pi-thumbs-up',
    title: 'Benar/Salah',
    summary:
      'Satu pernyataan dengan label yang dapat diganti, misalnya Benar/Salah, Fakta/Opini, atau Ya/Tidak.',
    status: 'available',
  },
  {
    id: 'soal-isian-singkat',
    icon: 'pi pi-pencil',
    title: 'Isian Singkat',
    summary:
      'Jawaban singkat dicocokkan dengan beberapa kunci, dengan pemeriksaan guru untuk ejaan lain.',
    status: 'available',
  },
  {
    id: 'soal-uraian',
    icon: 'pi pi-align-left',
    title: 'Uraian',
    summary: 'Jawaban panjang yang dinilai guru dengan rubrik.',
    status: 'available',
  },
  {
    id: 'soal-bs-majemuk',
    icon: 'pi pi-list-check',
    title: 'Benar/Salah Majemuk',
    summary: 'Tabel beberapa pernyataan, masing-masing dijawab benar atau salah.',
    status: 'available',
  },
  {
    id: 'soal-menjodohkan',
    icon: 'pi pi-arrow-right-arrow-left',
    title: 'Menjodohkan',
    summary: 'Pasangkan butir di kolom kiri dengan kolom kanan.',
    status: 'available',
  },
  {
    id: 'soal-mengurutkan',
    icon: 'pi pi-sort-amount-down',
    title: 'Mengurutkan',
    summary: 'Susun langkah atau kejadian dengan seret dan lepas.',
    status: 'available',
  },
  {
    id: 'soal-pengelompokan',
    icon: 'pi pi-th-large',
    title: 'Pengelompokan',
    summary: 'Seret butir ke kategori yang tepat.',
    status: 'available',
  },
  {
    id: 'soal-isian-angka',
    icon: 'pi pi-calculator',
    title: 'Isian Angka',
    summary: 'Jawaban angka dengan toleransi.',
    status: 'available',
  },
  {
    id: 'soal-rumpang',
    icon: 'pi pi-ellipsis-h',
    title: 'Melengkapi Rumpang',
    summary: 'Isi kalimat rumpang dengan mengetik, memilih, atau menyeret kata.',
    status: 'available',
  },
  {
    id: 'soal-klik-area',
    icon: 'pi pi-map-marker',
    title: 'Klik Area pada Gambar',
    summary: 'Siswa menandai bagian gambar yang diminta.',
    status: 'coming_soon',
  },
  {
    id: 'soal-unggah-file',
    icon: 'pi pi-upload',
    title: 'Unggah File',
    summary: 'Siswa mengunggah hasil kerja, dinilai guru dengan rubrik.',
    status: 'coming_soon',
  },
  {
    id: 'soal-koding',
    icon: 'pi pi-code',
    title: 'Soal Koding',
    summary: 'Kode siswa dijalankan otomatis terhadap kasus uji.',
    status: 'coming_soon',
  },
]
