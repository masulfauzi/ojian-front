import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import { conflictField, createStudent, importStudents, updateStudent } from '../api/student.api'
import { createStudentSchema, updateStudentSchema } from '../schemas/student.schema'

vi.mock('@/shared/api/http', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }
})

const errorsOf = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? {} : result.error.flatten().fieldErrors
}

const valid = {
  name: 'Siti Aminah',
  nis: '2026001',
  nisn: '0012345678',
  gender: null,
  birthPlace: '',
  birthDate: '',
  admissionDate: '2026-07-13',
  email: '',
  password: '',
  classId: null,
}

describe('student schema', () => {
  it('menerima data minimal; opsional kosong menjadi null', () => {
    const result = createStudentSchema.parse(valid)
    expect(result).toMatchObject({ birthDate: null, email: null, password: null, classId: null })
    expect(result.admissionDate).toBe('2026-07-13')
  })

  it('NISN 10 digit dan NIS sesuai pola', () => {
    expect(errorsOf(createStudentSchema, { ...valid, nisn: '12345' }).nisn).toEqual([
      'NISN harus 10 digit angka',
    ])
    expect(errorsOf(createStudentSchema, { ...valid, nis: 'NIS 01' }).nis[0]).toMatch(/hanya huruf/)
  })

  it('password opsional, tetapi 8–72 karakter bila diisi', () => {
    expect(errorsOf(createStudentSchema, { ...valid, password: 'pendek' }).password).toEqual([
      'harus 8–72 karakter',
    ])
    expect(createStudentSchema.safeParse({ ...valid, password: 'rahasia123' }).success).toBe(true)
  })

  it('ubah: status wajib salah satu status siswa', () => {
    const { password: _p, classId: _c, ...rest } = valid
    expect(updateStudentSchema.safeParse({ ...rest, status: 'graduated' }).success).toBe(true)
    expect(errorsOf(updateStudentSchema, { ...rest, status: 'cuti' }).status[0]).toMatch(
      /harus salah satu/,
    )
  })
})

describe('student api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createStudent mengembalikan password awal dan tidak mengirim field kosong', async () => {
    http.post.mockResolvedValue({
      data: {
        data: {
          id: 's',
          name: 'Siti',
          username: '0012345678',
          status: 'active',
          initial_password: 'k7Pq2xWm',
        },
      },
    })
    const parsed = createStudentSchema.parse({ ...valid, classId: 'c1' })
    const { student, initialPassword } = await createStudent(parsed, { schoolId: 'sch' })
    expect(http.post).toHaveBeenCalledWith('/students', {
      name: 'Siti Aminah',
      nis: '2026001',
      nisn: '0012345678',
      admission_date: '2026-07-13',
      class_id: 'c1',
      school_id: 'sch',
    })
    expect(initialPassword).toBe('k7Pq2xWm')
    expect(student.username).toBe('0012345678')
  })

  it('updateStudent mengirim status; error username dipetakan ke nisn', async () => {
    http.put.mockRejectedValue(
      new ApiError({
        status: 400,
        message: 'Validasi gagal',
        fieldErrors: { username: 'sudah dipakai', birth_date: 'x' },
      }),
    )
    const error = await updateStudent('s', { ...valid, status: 'active' }).catch((e) => e)
    expect(http.put.mock.calls[0][1]).toMatchObject({ status: 'active' })
    expect(error.fieldErrors).toEqual({ nisn: 'sudah dipakai', birthDate: 'x' })
  })

  it('conflictField', () => {
    const c = (message) => conflictField(new ApiError({ status: 409, message }))
    expect(c('NIS sudah dipakai siswa lain')).toBe('nis')
    expect(c('NISN sudah dipakai siswa lain')).toBe('nisn')
    expect(c('Username sudah digunakan')).toBe('nisn')
    expect(c('Email sudah digunakan')).toBe('email')
  })

  it('importStudents mengunggah FormData dan memetakan laporan', async () => {
    http.post.mockResolvedValue({
      data: {
        data: {
          total: 2,
          created: 1,
          failed: 1,
          rows: [
            {
              row: 2,
              nisn: '0012345678',
              name: 'Siti',
              status: 'created',
              initial_password: 'abc12345',
            },
            { row: 3, nisn: '1', name: 'Budi', status: 'failed', message: 'format NISN salah' },
          ],
        },
      },
    })
    const file = new File(['x'], 'siswa.xlsx')
    const report = await importStudents(file, { schoolId: 'sch' })
    const [url, body, config] = http.post.mock.calls[0]
    expect(url).toBe('/students/import')
    expect(body.get('file')).toBeInstanceOf(File)
    expect(config.params).toEqual({ school_id: 'sch' })
    expect(report.rows[0].initialPassword).toBe('abc12345')
    expect(report.rows[1]).toMatchObject({
      status: 'failed',
      message: 'format NISN salah',
      initialPassword: null,
    })
  })
})
