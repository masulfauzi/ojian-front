import { ROLE_ADMIN } from '@/modules/auth'

export default [
  { label: 'User', icon: 'pi pi-users', to: { name: 'users' }, roles: [ROLE_ADMIN], order: 90 },
]
