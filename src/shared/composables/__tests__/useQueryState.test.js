import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQueryState } from '../useQueryState'

async function setup(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/list', name: 'list', component: { render: () => null } }],
  })
  await router.push(path)
  let state
  const Comp = defineComponent({
    setup() {
      state = useQueryState({
        page: { type: 'page' },
        search: { type: 'string' },
        level: { type: 'string', options: ['SD', 'SMP'] },
        is_active: { type: 'boolean' },
      })
      return () => h('div')
    },
  })
  mount(Comp, { global: { plugins: [router] } })
  return { state, router }
}

describe('useQueryState', () => {
  it('membaca query URL dengan tipe yang benar', async () => {
    const { state } = await setup('/list?page=3&search=budi&level=SMP&is_active=false')
    expect(state.query.value).toEqual({ page: 3, search: 'budi', level: 'SMP', is_active: false })
  })

  it('nilai tidak valid jatuh ke default', async () => {
    const { state } = await setup('/list?page=-2&level=TK&is_active=ya')
    expect(state.query.value).toEqual({ page: 1, search: '', level: '', is_active: null })
  })

  it('update menulis query dan membuang nilai default', async () => {
    const { state, router } = await setup('/list?page=2&search=a')
    state.update({ search: '', is_active: true, page: 1 })
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ is_active: 'true' })
    expect(state.isActiveRoute()).toBe(true)
  })
})
