import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { ApiError } from '../errors'
import { http, setAuthHandlers } from '../http'

const ok = (config, data = {}) => ({ data, status: 200, statusText: 'OK', headers: {}, config })

function fail(config, status, data = {}) {
  const response = { data, status, statusText: String(status), headers: {}, config }
  throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response)
}

const originalAdapter = http.defaults.adapter

describe('http client: refresh token', () => {
  let token
  let refreshTokens
  let onUnauthorized

  beforeEach(() => {
    token = 'expired'
    refreshTokens = vi.fn()
    onUnauthorized = vi.fn()
    setAuthHandlers({ getAccessToken: () => token, refreshTokens, onUnauthorized })
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('mengirim header Authorization dengan access token', async () => {
    token = 'abc'
    http.defaults.adapter = vi.fn(async (config) => ok(config))
    await http.get('/auth/me')
    expect(http.defaults.adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer abc')
  })

  it('dua request 401 bersamaan hanya memicu SATU refresh, lalu keduanya diulang', async () => {
    refreshTokens.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      token = 'fresh'
    })
    http.defaults.adapter = vi.fn(async (config) =>
      config.headers.Authorization === 'Bearer fresh'
        ? ok(config, { data: config.url })
        : fail(config, 401, { message: 'Token tidak valid' }),
    )

    const [a, b] = await Promise.all([http.get('/users'), http.get('/auth/me')])

    expect(refreshTokens).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(a.data.data).toBe('/users')
    expect(b.data.data).toBe('/auth/me')
    // 2 request awal + 2 pengulangan.
    expect(http.defaults.adapter).toHaveBeenCalledTimes(4)
  })

  it('bila refresh gagal, onUnauthorized dipanggil (sekali) dan request ditolak', async () => {
    refreshTokens.mockRejectedValue(new Error('refresh gagal'))
    http.defaults.adapter = vi.fn(async (config) =>
      fail(config, 401, { message: 'Token tidak valid' }),
    )

    const results = await Promise.allSettled([http.get('/users'), http.get('/auth/me')])

    expect(refreshTokens).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    for (const result of results) {
      expect(result.status).toBe('rejected')
      expect(result.reason).toBeInstanceOf(ApiError)
      expect(result.reason.status).toBe(401)
    }
  })

  it('401 dari endpoint login (skipAuthRefresh) tidak memicu refresh', async () => {
    http.defaults.adapter = vi.fn(async (config) =>
      fail(config, 401, { success: false, message: 'Email atau password salah' }),
    )

    await expect(
      http.post('/auth/login', {}, { skipAuth: true, skipAuthRefresh: true }),
    ).rejects.toMatchObject({ status: 401, message: 'Email atau password salah' })
    expect(refreshTokens).not.toHaveBeenCalled()
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(http.defaults.adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('request yang sudah diulang dan tetap 401 tidak refresh lagi', async () => {
    refreshTokens.mockImplementation(async () => {
      token = 'fresh'
    })
    http.defaults.adapter = vi.fn(async (config) => fail(config, 401))

    await expect(http.get('/users')).rejects.toMatchObject({ status: 401 })
    expect(refreshTokens).toHaveBeenCalledTimes(1)
    expect(http.defaults.adapter).toHaveBeenCalledTimes(2)
  })
})

describe('http client: normalisasi error', () => {
  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('error validasi menjadi { status, message, fieldErrors }', async () => {
    http.defaults.adapter = async (config) =>
      fail(config, 400, {
        success: false,
        message: 'Validasi gagal',
        errors: [
          { field: 'email', message: 'format email tidak valid' },
          { field: 'name', message: 'wajib diisi' },
        ],
      })

    const error = await http.post('/users', {}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Validasi gagal')
    expect(error.fieldErrors).toEqual({ email: 'format email tidak valid', name: 'wajib diisi' })
  })

  it('error jaringan menjadi status 0 dengan pesan Indonesia', async () => {
    http.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    }

    const error = await http.get('/users').catch((e) => e)

    expect(error.status).toBe(0)
    expect(error.message).toMatch(/Tidak dapat terhubung/)
  })
})
