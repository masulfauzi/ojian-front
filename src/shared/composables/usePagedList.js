import { ref } from 'vue'

export const DEFAULT_PAGE_SIZE = 10

/**
 * State daftar berhalaman untuk dipakai di dalam setup store Pinia.
 *
 *   const list = usePagedList((query) => schoolApi.listSchools(query))
 *   await list.fetch({ page: 2, search: 'sma' })
 *
 * `fetcher(query)` harus mengembalikan `{ items, meta }` (lihat `unwrapList`). Response lama
 * (mis. saat mengetik cepat) tidak menimpa response yang lebih baru.
 */
export function usePagedList(fetcher, defaults = {}) {
  const items = ref([])
  const meta = ref({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref(null)
  const lastQuery = ref({ page: 1, limit: DEFAULT_PAGE_SIZE, ...defaults })

  let requestSeq = 0

  async function fetch(query = {}) {
    const seq = ++requestSeq
    lastQuery.value = { ...lastQuery.value, ...query }
    loading.value = true
    error.value = null
    try {
      const result = await fetcher(lastQuery.value)
      if (seq !== requestSeq) return
      items.value = result.items
      meta.value = result.meta
    } catch (err) {
      if (seq !== requestSeq) return
      error.value = err
      throw err
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  const reload = () => fetch()

  /** Muat ulang setelah menghapus; mundur satu halaman bila item terakhir di halaman ini terhapus. */
  function reloadAfterDelete() {
    const { page } = lastQuery.value
    return items.value.length === 1 && page > 1 ? fetch({ page: page - 1 }) : reload()
  }

  /** Ganti satu item di daftar tanpa memuat ulang. */
  function replaceItem(item) {
    const index = items.value.findIndex((it) => it.id === item.id)
    if (index !== -1) items.value[index] = item
  }

  return { items, meta, loading, error, lastQuery, fetch, reload, reloadAfterDelete, replaceItem }
}
