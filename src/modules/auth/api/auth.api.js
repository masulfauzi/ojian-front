// Semua pemetaan kontrak endpoint /auth ada di file ini.
// Sumber: Swagger exam-api (docs/swagger.yaml) — TokenResponse & MeResponse.
import { http, unwrap } from '@/shared/api/http'
import { remapFieldErrors } from '@/shared/api/errors'

// Endpoint publik: tanpa header Authorization dan tidak memicu siklus refresh saat 401.
const PUBLIC = { skipAuth: true, skipAuthRefresh: true }

const FIELD_MAP = {
  old_password: 'oldPassword',
  new_password: 'newPassword',
}

const rethrow = (error) => {
  throw remapFieldErrors(error, FIELD_MAP)
}

/** data: { access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, token_type } */
export const toTokens = (data) => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  accessTokenExpiresAt: data.access_token_expires_at ?? null,
  refreshTokenExpiresAt: data.refresh_token_expires_at ?? null,
})

/** data: { id, name, email, role, is_active, created_at } */
export const toUser = (data) => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  isActive: data.is_active,
  createdAt: data.created_at,
})

export async function login({ email, password }) {
  const res = await http.post('/auth/login', { email, password }, PUBLIC).catch(rethrow)
  return toTokens(unwrap(res))
}

export async function refresh(refreshToken) {
  const res = await http.post('/auth/refresh', { refresh_token: refreshToken }, PUBLIC)
  return toTokens(unwrap(res))
}

export async function me() {
  const res = await http.get('/auth/me')
  return toUser(unwrap(res))
}

export async function changePassword({ oldPassword, newPassword }) {
  await http
    .post('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
    .catch(rethrow)
}
