import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth'

/**
 * Menu lokal dari `src/modules/<nama>/menu.js` (export default array). Sejak sidebar diambil
 * dari `GET /auth/menus`, file ini hanya dipakai alat development (mis. playground) yang
 * tidak terdaftar di backend. Bentuk item: { label, icon, to, order? }
 */
const localItems = Object.values(
  import.meta.glob('../modules/*/menu.js', { eager: true, import: 'default' }),
)
  .flat()
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

/**
 * Bentuk item sidebar:
 *   { key, label, icon, to }                 halaman
 *   { key, label, icon, children: [...] }    grup
 */
function toNavItem(menu) {
  return menu.type === 'group'
    ? { key: menu.id, label: menu.name, icon: menu.icon, children: menu.children.map(toNavItem) }
    : { key: menu.id, label: menu.name, icon: menu.icon, to: menu.path }
}

/**
 * Menu sidebar untuk role aktif: pohon dari server, halaman yang path-nya belum dikenal
 * router disembunyikan, grup kosong dibuang, lalu menu lokal development ditambahkan.
 */
export function useMenu() {
  const auth = useAuthStore()
  const router = useRouter()

  const isKnownPath = (path) => router.resolve(path).name !== 'not-found'

  const prune = (items) =>
    items
      .map((item) => (item.children ? { ...item, children: prune(item.children) } : item))
      .filter((item) => (item.children ? item.children.length > 0 : isKnownPath(item.to)))

  return computed(() => {
    const items = prune(auth.menus.map(toNavItem))
    if (localItems.length) {
      items.push({
        key: 'local-dev',
        label: 'Development',
        icon: 'pi pi-wrench',
        children: localItems.map((item) => ({ key: item.label, ...item })),
      })
    }
    return items
  })
}
