// Poin keamanan dan kendali yang boleh diklaim (jangan menambah klaim lain).

export const TRUST_POINTS = [
  {
    id: 'aman-akses',
    icon: 'pi pi-shield',
    title: 'Hak akses berlapis',
    summary:
      'Hak akses diatur per peran dan per menu, dan setiap sekolah hanya melihat datanya sendiri.',
  },
  {
    id: 'aman-kunci',
    icon: 'pi pi-key',
    title: 'Kunci jawaban tetap di server',
    summary: 'Kunci jawaban tidak pernah dikirim ke perangkat siswa.',
  },
  {
    id: 'aman-waktu',
    icon: 'pi pi-clock',
    title: 'Waktu dari server',
    summary: 'Waktu pengerjaan dan presensi dihitung oleh server, bukan jam perangkat.',
  },
  {
    id: 'aman-versi',
    icon: 'pi pi-lock',
    title: 'Nilai lama tidak berubah',
    summary: 'Soal yang sudah dipakai ujian dikunci, sehingga nilai lama tidak berubah.',
  },
  {
    id: 'aman-foto',
    icon: 'pi pi-eye-slash',
    title: 'Foto selfie dijaga',
    summary:
      'Foto selfie disimpan privat, aksesnya terbatas, dan dihapus otomatis setelah masa simpan.',
  },
  {
    id: 'aman-riwayat',
    icon: 'pi pi-history',
    title: 'Koreksi tercatat',
    summary: 'Koreksi data presensi wajib beralasan dan tercatat riwayatnya.',
  },
]
