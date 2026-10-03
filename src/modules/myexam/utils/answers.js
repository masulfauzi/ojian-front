// Fungsi murni untuk keadaan jawaban siswa (format `answer` backend, soal.md §6).

const hasText = (value) => typeof value === 'string' && value.replace(/<[^>]+>/g, '').trim() !== ''
const nonEmptyObject = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  Object.values(value).some((v) => v !== null && v !== '')

/** Apakah jawaban dianggap terisi (untuk panel nomor dan konfirmasi kumpulkan). */
export function isAnswered(type, answer) {
  if (!answer || typeof answer !== 'object') return false
  switch (type) {
    case 'single_choice':
      return typeof answer.selected === 'string' && answer.selected !== ''
    case 'multiple_choice':
      return Array.isArray(answer.selected) && answer.selected.length > 0
    case 'true_false':
      return typeof answer.value === 'boolean'
    case 'true_false_group':
      return nonEmptyObject(answer.values)
    case 'matching':
      return nonEmptyObject(answer.pairs)
    case 'ordering':
      return Array.isArray(answer.order) && answer.order.length > 0
    case 'categorize':
      return nonEmptyObject(answer.placement)
    case 'short_answer':
    case 'numeric':
      return hasText(answer.text)
    case 'fill_blank':
      return nonEmptyObject(answer.blanks)
    case 'essay':
      return hasText(answer.html)
    default:
      return nonEmptyObject(answer)
  }
}

/** Ringkasan untuk konfirmasi kumpulkan. */
export function answerStats(questions, answers, flags) {
  let answered = 0
  let flagged = 0
  for (const q of questions) {
    if (isAnswered(q.type, answers[q.examQuestionId])) answered += 1
    if (flags[q.examQuestionId]) flagged += 1
  }
  return { total: questions.length, answered, unanswered: questions.length - answered, flagged }
}
