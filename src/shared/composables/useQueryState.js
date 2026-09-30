import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from './useDebounce'

function readValue(field, raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  switch (field.type) {
    case 'page': {
      const n = Number.parseInt(value, 10)
      return Number.isFinite(n) && n >= 1 ? n : 1
    }
    case 'boolean':
      return value === 'true' ? true : value === 'false' ? false : null
    default: {
      const text = typeof value === 'string' ? value : ''
      if (field.options && !field.options.includes(text)) return field.default ?? ''
      return text
    }
  }
}

const isDefault = (field, value) =>
  value === null || value === '' || (field.type === 'page' && value === 1)

/**
 * Filter halaman daftar yang disimpan di query URL (bisa di-refresh dan dibagikan).
 *
 *   const { query, update } = useQueryState({
 *     page: { type: 'page' },
 *     search: { type: 'string' },
 *     is_active: { type: 'boolean' },
 *     level: { type: 'string', options: ['SD', 'SMP'] },
 *   })
 *   query.value.page          // 1
 *   update({ search: 'budi', page: 1 })
 *
 * Nilai default (page 1, string kosong, null) tidak ditulis ke URL.
 */
export function useQueryState(fields) {
  const route = useRoute()
  const router = useRouter()
  const routeName = route.name

  const query = computed(() =>
    Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, readValue(field, route.query[key])]),
    ),
  )

  function update(patch) {
    const next = { ...query.value, ...patch }
    const result = {}
    for (const [key, field] of Object.entries(fields)) {
      const value = next[key] ?? null
      if (!isDefault(field, value)) result[key] = String(value)
    }
    router.replace({ query: result })
  }

  /** true selama route masih halaman ini (hindari memuat data saat sedang meninggalkannya). */
  const isActiveRoute = () => route.name === routeName

  return { query, update, isActiveRoute }
}

/**
 * Input pencarian dengan debounce: nilai lokal langsung berubah (untuk v-model),
 * `apply(value)` dipanggil setelah `delay` ms. Tersinkron balik saat `source` berubah dari luar.
 */
export function useSearchInput(source, apply, delay = 300) {
  const input = ref(source())
  const debounced = useDebounceFn((value) => apply(value.trim()), delay)
  watch(input, (value) => debounced(value))
  watch(source, (value) => {
    if (value !== input.value.trim()) input.value = value
  })
  return input
}
