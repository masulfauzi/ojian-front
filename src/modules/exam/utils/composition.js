// Fungsi murni untuk menyusun soal paket (urutan, bagian, bobot) di halaman detail paket.

export const MAX_QUESTIONS = 300

/** Kelompokkan soal per bagian sesuai urutan bagian paket; bagian kosong tetap ada. */
export function groupBySection(sections, questions) {
  const list = sections.length ? sections : [{ no: 1, title: '', instruction: '' }]
  return list.map((section) => ({
    ...section,
    questions: questions.filter((q) => q.sectionNo === section.no),
  }))
}

/** Ratakan kembali kelompok bagian → daftar soal dengan `sectionNo` dan `position` baru. */
export function flattenGroups(groups) {
  return groups
    .flatMap((group) => group.questions.map((q) => ({ ...q, sectionNo: group.no })))
    .map((q, index) => ({ ...q, position: index + 1 }))
}

/** Tambahkan soal bank (belum ada di paket) ke akhir bagian `sectionNo`. */
export function addQuestions(questions, picked, sectionNo) {
  const existing = new Set(questions.map((q) => q.questionId))
  const added = picked
    .filter((item) => !existing.has(item.id))
    .map((item) => ({
      id: null,
      questionId: item.id,
      typeCode: item.typeCode,
      preview: item.preview,
      versionNo: item.versionNo,
      points: Number(item.defaultPoints ?? 1),
      sectionNo,
    }))
  // Sisipkan di akhir bagian agar urutan bagian tetap berurutan.
  const lastIndex = questions.findLastIndex((q) => q.sectionNo <= sectionNo)
  const next = [...questions]
  next.splice(lastIndex + 1, 0, ...added)
  return next.map((q, index) => ({ ...q, position: index + 1 }))
}

export const totalPoints = (questions) =>
  Math.round(questions.reduce((sum, q) => sum + Number(q.points || 0), 0) * 100) / 100

/** Bandingkan susunan untuk deteksi perubahan belum disimpan. */
export const compositionKey = (questions) =>
  JSON.stringify(questions.map((q) => [q.questionId, q.sectionNo, Number(q.points)]))
