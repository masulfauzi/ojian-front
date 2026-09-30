// Semua pemetaan kontrak endpoint /auth ada di file ini.
// Sumber: Swagger exam-api — AuthResponse, SessionResponse, SidebarMenu, Permission.
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

// Endpoint publik: tanpa header Authorization dan tidak memicu siklus refresh saat 401.
const PUBLIC = { skipAuth: true, skipAuthRefresh: true }

const FIELD_MAP = {
  school_code: 'schoolCode',
  old_password: 'oldPassword',
  new_password: 'newPassword',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** RoleResponse: { id, code, name, is_default } */
export const toRole = (data) => ({
  id: data.id,
  code: data.code,
  name: data.name,
  isDefault: Boolean(data.is_default),
})

/** UserInfo: { id, name, username, email, school, must_change_password, last_login_at, created_at } */
export const toUser = (data) => ({
  id: data.id,
  name: data.name,
  username: data.username,
  email: data.email ?? null,
  school: data.school
    ? { id: data.school.id, code: data.school.code, name: data.school.name }
    : null,
  mustChangePassword: Boolean(data.must_change_password),
  lastLoginAt: data.last_login_at ?? null,
  createdAt: data.created_at ?? null,
})

/** AuthResponse dari login, refresh, dan switch-role (sudah memuat user dan role). */
export const toSession = (data) => ({
  tokens: data.access_token
    ? {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessTokenExpiresAt: data.access_token_expires_at ?? null,
        refreshTokenExpiresAt: data.refresh_token_expires_at ?? null,
      }
    : null,
  user: toUser(data.user),
  activeRole: data.active_role ? toRole(data.active_role) : null,
  roles: (data.roles ?? []).map(toRole),
  roleChanged: Boolean(data.role_changed),
})

/** SidebarMenu: { id, parent_id, code, name, type, path, icon, sort_order, children } */
export const toMenu = (data) => ({
  id: data.id,
  parentId: data.parent_id ?? null,
  code: data.code,
  name: data.name,
  type: data.type,
  path: data.path ?? null,
  icon: data.icon ?? null,
  sortOrder: data.sort_order ?? 0,
  children: (data.children ?? []).map(toMenu),
})

/** { [kodeMenu]: { can_view, can_create, can_update, can_delete } } → { view, create, update, delete } */
export const toPermissions = (data) =>
  Object.fromEntries(
    Object.entries(data ?? {}).map(([code, p]) => [
      code,
      {
        view: Boolean(p.can_view),
        create: Boolean(p.can_create),
        update: Boolean(p.can_update),
        delete: Boolean(p.can_delete),
      },
    ]),
  )

/** Login dengan email, atau username + kode sekolah (kosong untuk pengguna platform). */
export async function login({ login, password, schoolCode }) {
  const body = { login, password }
  if (schoolCode) body.school_code = schoolCode
  const res = await http.post('/auth/login', body, PUBLIC).catch(rethrow)
  return toSession(unwrap(res))
}

export async function refresh(refreshToken) {
  const res = await http.post('/auth/refresh', { refresh_token: refreshToken }, PUBLIC)
  return toSession(unwrap(res))
}

export async function switchRole(roleId) {
  const res = await http.post('/auth/switch-role', { role_id: roleId })
  return toSession(unwrap(res))
}

export async function fetchMenus() {
  const res = await http.get('/auth/menus')
  return (unwrap(res) ?? []).map(toMenu)
}

export async function fetchPermissions() {
  const res = await http.get('/auth/permissions')
  return toPermissions(unwrap(res))
}

export async function changePassword({ oldPassword, newPassword }) {
  await http
    .post('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
    .catch(rethrow)
}
