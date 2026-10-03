// Logika wizard kenaikan kelas (fungsi murni, tanpa Vue/HTTP).

/** Pilihan pemetaan khusus selain id kelas tujuan. */
export const GRADUATE = '__graduate__'
export const SKIP = '__skip__'

/** Tingkat akhir tiap jenjang (SD/MI 6, SMP/MTs 9, SMA/MA/SMK 12, SMK 4 tahun 13). */
const FINAL_GRADES = new Set([6, 9, 12, 13])

/** Bagian nama kelas setelah penanda tingkat: "X RPL 1" → "rpl 1", "VII-A" → "a". */
export function classSuffix(name = '') {
  const parts = name.trim().split(/[\s.-]+/)
  return parts.slice(1).join(' ').toLowerCase()
}

/**
 * Saran kelas tujuan untuk kelas asal:
 * - kelas tingkat+1 dengan akhiran nama sama (atau satu-satunya kelas tingkat+1);
 * - bila tidak ada kelas tingkat+1 dan kelas asal di tingkat akhir → Lulus;
 * - selain itu null (pengguna memilih sendiri).
 */
export function suggestTarget(fromClass, toClasses) {
  const next = toClasses.filter((c) => c.gradeLevel === fromClass.gradeLevel + 1)
  if (next.length) {
    const suffix = classSuffix(fromClass.name)
    const match =
      next.find((c) => classSuffix(c.name) === suffix) ?? (next.length === 1 ? next[0] : null)
    return match?.id ?? null
  }
  return FINAL_GRADES.has(fromClass.gradeLevel) ? GRADUATE : null
}

/** Pemetaan yang akan diproses: [fromClassId, target] tanpa yang dilewati/belum dipilih. */
const activeMappings = (mappings) =>
  Object.entries(mappings).filter(([, target]) => target && target !== SKIP)

/** Anggota yang ikut diproses untuk satu kelas asal. */
const includedOf = (members, classId) => (members[classId] ?? []).filter((m) => m.include)

/**
 * Susun data POST /promotions.
 *
 * @param {object} state
 * @param {string} state.fromSemesterId
 * @param {string} state.toSemesterId
 * @param {Record<string, string>} state.mappings  fromClassId → id kelas tujuan | GRADUATE | SKIP
 * @param {Record<string, Array<{studentId: string, include: boolean, override: string|null}>>} state.members
 * @param {boolean} state.activate
 *
 * - Kelas tanpa siswa yang ikut diproses tidak dikirim.
 * - `studentIds` hanya dikirim bila ada siswa yang dikecualikan (kosong berarti semua siswa).
 * - `overrides` hanya untuk siswa yang diarahkan ke kelas berbeda dari pemetaan kelasnya.
 */
export function buildPromotionPayload({
  fromSemesterId,
  toSemesterId,
  mappings,
  members,
  activate,
}) {
  const used = activeMappings(mappings).filter(([id]) => includedOf(members, id).length > 0)
  const all = used.flatMap(([id]) => members[id] ?? [])
  const included = all.filter((m) => m.include)
  const hasExcluded = included.length !== all.length

  return {
    fromSemesterId,
    toSemesterId,
    mappings: used.map(([fromClassId, target]) => ({
      fromClassId,
      toClassId: target === GRADUATE ? null : target,
    })),
    studentIds: hasExcluded ? included.map((m) => m.studentId) : undefined,
    overrides: used.flatMap(([id, target]) =>
      includedOf(members, id)
        .filter((m) => m.override && m.override !== target)
        .map((m) => ({ studentId: m.studentId, toClassId: m.override })),
    ),
    activate: Boolean(activate),
  }
}

/** Ringkasan untuk konfirmasi: jumlah naik, lulus, diarahkan ke kelas lain, dan dikecualikan. */
export function summarizePromotion({ mappings, members }) {
  const summary = { promoted: 0, graduated: 0, redirected: 0, excluded: 0 }
  for (const [id, target] of activeMappings(mappings)) {
    for (const member of members[id] ?? []) {
      if (!member.include) summary.excluded += 1
      else if (member.override && member.override !== target) summary.redirected += 1
      else if (target === GRADUATE) summary.graduated += 1
      else summary.promoted += 1
    }
  }
  return summary
}

/** Semua kelas asal sudah diberi keputusan, dan minimal satu tidak dilewati. */
export function mappingsComplete(fromClasses, mappings) {
  return (
    fromClasses.every((c) => Boolean(mappings[c.id])) &&
    fromClasses.some((c) => mappings[c.id] !== SKIP)
  )
}
