import { beforeEach, describe, expect, it } from 'vitest'
import { migrateLegacyKeys, storage } from '../storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('menyimpan dengan prefix mulang:', () => {
    storage.set('refresh_token', 'abc')
    expect(localStorage.getItem('mulang:refresh_token')).toBe('"abc"')
    expect(storage.get('refresh_token')).toBe('abc')
  })

  it('memindahkan kunci lama exam-web: tanpa menimpa kunci baru', () => {
    localStorage.setItem('exam-web:refresh_token', '"lama"')
    localStorage.setItem('exam-web:theme', '"x"')
    localStorage.setItem('mulang:theme', '"baru"')
    localStorage.setItem('lain', '1')
    migrateLegacyKeys()
    expect(storage.get('refresh_token')).toBe('lama')
    expect(storage.get('theme')).toBe('baru')
    expect(localStorage.getItem('exam-web:refresh_token')).toBeNull()
    expect(localStorage.getItem('exam-web:theme')).toBeNull()
    expect(localStorage.getItem('lain')).toBe('1')
  })
})
