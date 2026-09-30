import { useToast } from 'primevue/usetoast'

const LIFE = 4000

/** Toast sukses/error/info. `error()` menerima string atau objek error (ApiError). */
export function useNotify() {
  const toast = useToast()

  const show = (severity, summary, detail) => toast.add({ severity, summary, detail, life: LIFE })

  return {
    success: (detail, summary = 'Berhasil') => show('success', summary, detail),
    info: (detail, summary = 'Info') => show('info', summary, detail),
    warn: (detail, summary = 'Perhatian') => show('warn', summary, detail),
    error: (errorOrMessage, summary = 'Gagal') => {
      const detail =
        typeof errorOrMessage === 'string'
          ? errorOrMessage
          : errorOrMessage?.message || 'Terjadi kesalahan'
      show('error', summary, detail)
    },
  }
}
