import { useConfirm as usePrimeConfirm } from 'primevue/useconfirm'

/**
 * Dialog konfirmasi berbasis Promise.
 *
 *   const { confirmDelete } = useConfirm()
 *   if (await confirmDelete('user Budi')) { ... }
 */
export function useConfirm() {
  const confirm = usePrimeConfirm()

  function ask({
    message,
    header = 'Konfirmasi',
    icon = 'pi pi-question-circle',
    acceptLabel = 'Ya',
    rejectLabel = 'Batal',
    danger = false,
  }) {
    return new Promise((resolve) => {
      confirm.require({
        message,
        header,
        icon,
        acceptProps: { label: acceptLabel, severity: danger ? 'danger' : undefined },
        rejectProps: { label: rejectLabel, severity: 'secondary', outlined: true },
        accept: () => resolve(true),
        reject: () => resolve(false),
        onHide: () => resolve(false),
      })
    })
  }

  function confirmDelete(itemLabel = 'data ini') {
    return ask({
      header: 'Hapus data',
      message: `Yakin ingin menghapus ${itemLabel}? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Hapus',
      danger: true,
    })
  }

  return { ask, confirmDelete }
}
