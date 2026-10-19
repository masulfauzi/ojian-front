import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Id bagian yang sedang terlihat (untuk menyorot tautan header). Tanpa IntersectionObserver,
 * tidak ada yang disorot.
 */
export function useActiveSection(ids) {
  const active = ref('')
  let observer = null
  const visible = new Map()

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        active.value = ids.find((id) => visible.get(id)) ?? ''
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())

  return active
}
