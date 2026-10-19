// Pembungkus localStorage yang aman: tidak melempar error bila storage diblokir
// (mode privat, kuota penuh) dan memberi prefix agar kunci tidak bentrok.
const PREFIX = 'mulang:'
// Prefix sebelum aplikasi berganti nama menjadi Mulang.id. Kuncinya dipindahkan sekali agar
// refresh token & preferensi lama tetap terbaca (pengguna tidak ter-logout).
const LEGACY_PREFIX = 'exam-web:'

function backend() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function migrateLegacyKeys(store = backend()) {
  try {
    if (!store) return
    const legacy = []
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i)
      if (key?.startsWith(LEGACY_PREFIX)) legacy.push(key)
    }
    for (const key of legacy) {
      const target = PREFIX + key.slice(LEGACY_PREFIX.length)
      if (store.getItem(target) === null) store.setItem(target, store.getItem(key))
      store.removeItem(key)
    }
  } catch {
    // Diabaikan.
  }
}

migrateLegacyKeys()

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
