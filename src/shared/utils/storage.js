// Pembungkus localStorage yang aman: tidak melempar error bila storage diblokir
// (mode privat, kuota penuh) dan memberi prefix agar kunci tidak bentrok.
const PREFIX = 'exam-web:'

function backend() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = backend()?.getItem(PREFIX + key)
      return raw === null || raw === undefined ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      backend()?.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Diabaikan: aplikasi tetap berjalan tanpa persistensi.
    }
  },

  remove(key) {
    try {
      backend()?.removeItem(PREFIX + key)
    } catch {
      // Diabaikan.
    }
  },
}
