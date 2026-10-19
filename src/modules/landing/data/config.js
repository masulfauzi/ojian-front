// Konfigurasi tampilan landing dari variabel lingkungan (semua opsional).

const env = import.meta.env

export const appName = () => env.VITE_APP_NAME || 'Mulang.id'
export const orgName = () => env.VITE_ORG_NAME || appName()
export const siteUrl = () => env.VITE_SITE_URL || ''

/** Tautan email dengan subjek ter-encode, atau null. */
export function mailtoLink(subject = `Informasi ${appName()}`) {
  const email = (env.VITE_CONTACT_EMAIL || '').trim()
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : null
}

/** Tautan WhatsApp hanya bila nomornya berisi angka saja (format internasional tanpa plus). */
export function whatsappLink(text = `Halo, saya ingin bertanya tentang ${appName()}.`) {
  const number = (env.VITE_CONTACT_WHATSAPP || '').trim()
  return /^\d{8,15}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : null
}

export const contactEmail = () => (env.VITE_CONTACT_EMAIL || '').trim()
