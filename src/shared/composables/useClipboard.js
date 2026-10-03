import { useNotify } from './useNotify'

/** Salin teks ke clipboard dan beri tahu pengguna lewat toast. */
export function useClipboard() {
  const notify = useNotify()

  async function copy(text, label = 'Teks') {
    try {
      await navigator.clipboard.writeText(text)
      notify.success(`${label} disalin ke clipboard`, 'Disalin')
      return true
    } catch {
      notify.error('Browser menolak akses clipboard. Salin secara manual.')
      return false
    }
  }

  return { copy }
}
