import { describe, expect, it } from 'vitest'
import {
  buildReorderItems,
  cloneTree,
  flattenTree,
  groupsOf,
  nextSortOrder,
  positionsOf,
  slotsOf,
  countMoved,
} from '../utils/tree'

const serverTree = () => [
  { id: 'dash', type: 'page', parentId: null, sortOrder: 10, children: [] },
  {
    id: 'master',
    type: 'group',
    parentId: null,
    sortOrder: 90,
    children: [
      { id: 'schools', type: 'page', parentId: 'master', sortOrder: 10 },
      { id: 'users', type: 'page', parentId: 'master', sortOrder: 20 },
    ],
  },
]

describe('pohon menu', () => {
  it('flattenTree memberi urutan kelipatan 10 per induk', () => {
    expect(flattenTree(serverTree())).toEqual([
      { id: 'dash', parentId: null, sortOrder: 10 },
      { id: 'master', parentId: null, sortOrder: 20 },
      { id: 'schools', parentId: 'master', sortOrder: 10 },
      { id: 'users', parentId: 'master', sortOrder: 20 },
    ])
  })

  it('tanpa perubahan posisi hanya item yang nomor urutnya berbeda yang dikirim', () => {
    const original = positionsOf(serverTree())
    // master aslinya sort_order 90, setelah dinormalisasi menjadi 20.
    expect(buildReorderItems(cloneTree(serverTree()), original)).toEqual([
      { id: 'master', parentId: null, sortOrder: 20 },
    ])
  })

  it('memindahkan halaman ke akar dan menukar urutan anak', () => {
    const data = serverTree()
    const original = positionsOf(data)
    const tree = cloneTree(data)
    const [schools] = tree[1].children.splice(0, 1)
    tree.unshift(schools)

    expect(buildReorderItems(tree, original)).toEqual([
      { id: 'schools', parentId: null, sortOrder: 10 },
      { id: 'dash', parentId: null, sortOrder: 20 },
      { id: 'master', parentId: null, sortOrder: 30 },
      { id: 'users', parentId: 'master', sortOrder: 10 },
    ])
  })

  it('cloneTree tidak mengubah data asli', () => {
    const data = serverTree()
    const tree = cloneTree(data)
    tree[1].children.pop()
    expect(data[1].children).toHaveLength(2)
  })

  it('groupsOf dan nextSortOrder', () => {
    const tree = serverTree()
    expect(groupsOf(tree).map((g) => g.id)).toEqual(['master'])
    expect(nextSortOrder(tree)).toBe(100)
    expect(nextSortOrder(tree, 'master')).toBe(30)
    expect(nextSortOrder([], null)).toBe(10)
  })
})

describe('countMoved', () => {
  it('nomor sort_order yang tidak rapi tidak dihitung sebagai perubahan', () => {
    const data = serverTree()
    expect(countMoved(cloneTree(data), slotsOf(data))).toBe(0)
  })

  it('menukar dua anak menghitung keduanya', () => {
    const data = serverTree()
    const tree = cloneTree(data)
    tree[1].children.reverse()
    expect(countMoved(tree, slotsOf(data))).toBe(2)
  })

  it('memindahkan halaman keluar dari grup', () => {
    const data = serverTree()
    const tree = cloneTree(data)
    tree.push(tree[1].children.pop())
    expect(countMoved(tree, slotsOf(data))).toBe(1)
  })
})
