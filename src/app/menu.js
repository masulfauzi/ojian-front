import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth'

/**
 * Kumpulkan item menu sidebar dari semua modul: src/modules/<nama>/menu.js (export default array).
 * Bentuk item: { label, icon, to, roles?: string[], order?: number }
 */
const menuItems = Object.values(
  import.meta.glob('../modules/*/menu.js', { eager: true, import: 'default' }),
)
  .flat()
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

export const isMenuVisible = (item, role) => !item.roles?.length || item.roles.includes(role)

/** Menu yang boleh dilihat user yang sedang login. */
export function useMenu() {
  const auth = useAuthStore()
  return computed(() => menuItems.filter((item) => isMenuVisible(item, auth.role)))
}
