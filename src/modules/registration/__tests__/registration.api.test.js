import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import {
  checkNpsn,
  conflictField,
  registerSchool,
  toRegisterPayload,
} from '../api/registration.api'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn() } }
})

const values = {
  npsn: '20100001',
  schoolName: 'SMA Negeri 1 Jakarta',
  educationLevel: 'SMA',
  ownership: 'negeri',
  address: null,
  city: 'Jakarta Pusat',
  province: null,
  postalCode: null,
  schoolPhone: null,
  schoolEmail: null,
  adminName: 'Budi',
  adminUsername: 'admin.sman1jkt',
  adminEmail: 'admin@sman1jkt.sch.id',
  adminPhone: null,
  password: 'rahasia123',
  confirmPassword: 'rahasia123',
}

const authResponse = {
  access_token: 'a',
  refresh_token: 'r',
  user: {
    id: 'u',
    name: 'Budi',
    username: 'admin.sman1jkt',
    school: { id: 's', code: '20100001', name: 'SMAN 1' },
  },
  active_role: { id: 'r1', code: 'school_admin', name: 'Admin Sekolah', is_default: true },
  roles: [{ id: 'r1', code: 'school_admin', name: 'Admin Sekolah', is_default: true }],
  role_changed: false,
}

describe('registration api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('toRegisterPayload: camelCase → snake_case, field opsional kosong tidak dikirim', () => {
    expect(toRegisterPayload(values)).toEqual({
      npsn: '20100001',
      school_name: 'SMA Negeri 1 Jakarta',
      education_level: 'SMA',
      ownership: 'negeri',
      city: 'Jakarta Pusat',
      admin_name: 'Budi',
      admin_username: 'admin.sman1jkt',
      admin_email: 'admin@sman1jkt.sch.id',
      password: 'rahasia123',
    })
  })

  it('registerSchool memakai endpoint publik dan mengembalikan sesi', async () => {
    http.post.mockResolvedValue({ data: { success: true, data: authResponse } })

    const session = await registerSchool(values)

    expect(http.post).toHaveBeenCalledWith(
      '/auth/register-school',
      expect.objectContaining({ npsn: '20100001' }),
      { skipAuth: true, skipAuthRefresh: true },
    )
    expect(session.tokens.accessToken).toBe('a')
    expect(session.activeRole.code).toBe('school_admin')
    expect(session.user.school.code).toBe('20100001')
  })

  it('error validasi dari modul dalam dipetakan ke field form', async () => {
    http.post.mockRejectedValue(
      new ApiError({
        status: 400,
        message: 'Validasi gagal',
        fieldErrors: { username: 'tidak valid', email: 'format', code: 'kode', school_name: 'x' },
      }),
    )

    const error = await registerSchool(values).catch((e) => e)

    expect(error.fieldErrors).toEqual({
      adminUsername: 'tidak valid',
      adminEmail: 'format',
      npsn: 'kode',
      schoolName: 'x',
    })
  })

  it('checkNpsn', async () => {
    http.get.mockResolvedValue({ data: { data: { npsn: '20100001', registered: true } } })
    expect(await checkNpsn('20100001')).toEqual({ npsn: '20100001', registered: true })
    expect(http.get).toHaveBeenCalledWith('/auth/register-school/npsn/20100001', {
      skipAuth: true,
      skipAuthRefresh: true,
    })
  })

  it('conflictField memetakan pesan 409 ke field', () => {
    const conflict = (message) => conflictField(new ApiError({ status: 409, message }))
    expect(
      conflict('NPSN sudah terdaftar. Hubungi admin sekolah Anda atau administrator platform'),
    ).toBe('npsn')
    expect(conflict('Kode sekolah sudah digunakan')).toBe('npsn')
    expect(conflict('NPSN sudah digunakan')).toBe('npsn')
    expect(conflict('Username sudah digunakan')).toBe('adminUsername')
    expect(conflict('Email sudah digunakan')).toBe('adminEmail')
    expect(conflict('Email atau username sudah digunakan')).toBe('adminUsername')
    expect(conflict('Lainnya')).toBeNull()
  })
})
