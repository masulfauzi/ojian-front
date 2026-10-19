import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import PrimeVue from 'primevue/config'
import axe from 'axe-core'
import { useAuthStore } from '@/modules/auth'
import ContactSection from '../components/ContactSection.vue'
import { NAV_LINKS } from '../data/navigation'
import { PILLARS } from '../data/pillars'
import { QUESTION_TYPES } from '../data/questionTypes'
import LandingPage from '../views/LandingPage.vue'

const Stub = { template: '<div />' }

// jsdom tidak punya ResizeObserver (dipakai Tabs PrimeVue).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: LandingPage },
      { path: '/login', name: 'login', component: Stub },
      { path: '/dashboard', name: 'dashboard', component: Stub },
      { path: '/register-school', name: 'register-school', component: Stub },
    ],
  })
}

async function mountPage({ attach = false } = {}) {
  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  const wrapper = mount(LandingPage, {
    attachTo: attach ? document.body : undefined,
    global: { plugins: [router, PrimeVue] },
  })
  // Isi Tabs/Accordion dimuat terpisah (defineAsyncComponent).
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  window.scrollTo = vi.fn()
})
afterEach(() => {
  vi.unstubAllEnvs()
  document.body.innerHTML = ''
})

describe('LandingPage', () => {
  it('merender hero, semua bagian, dan semua pilar beserta fiturnya', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('h1').text()).toContain('Ujian online, presensi, dan jurnal mengajar')
    for (const id of ['fitur', 'jenis-soal', 'alur', 'peran', 'keamanan', 'faq']) {
      expect(wrapper.find(`#${id}`).exists(), id).toBe(true)
    }
    for (const pillar of PILLARS) {
      expect(wrapper.find(`#pilar-${pillar.id}`).exists(), pillar.id).toBe(true)
      for (const feature of pillar.features) {
        expect(wrapper.find(`[data-feature="${feature.id}"]`).text()).toContain(feature.title)
      }
    }
    expect(wrapper.findAll('[data-qtype]')).toHaveLength(QUESTION_TYPES.length)
    // Isi yang dimuat terpisah ikut tampil.
    expect(wrapper.find('#alur').text()).toContain('Susun bank soal')
    expect(wrapper.find('#peran').text()).toContain('Mengerjakan ujian')
    expect(wrapper.find('#faq').text()).toContain('Apakah foto selfie disimpan selamanya?')
  })

  it('label "Segera hadir" hanya pada entri coming_soon', async () => {
    const wrapper = await mountPage()
    const soon = [
      ...PILLARS.flatMap((p) => p.features).map((f) => [`[data-feature="${f.id}"]`, f.status]),
      ...QUESTION_TYPES.map((q) => [`[data-qtype="${q.id}"]`, q.status]),
    ]
    for (const [selector, status] of soon) {
      expect(wrapper.find(selector).text().includes('Segera hadir'), selector).toBe(
        status === 'coming_soon',
      )
    }
  })

  it('tautan jangkar header mengarah ke bagian yang ada', async () => {
    const wrapper = await mountPage()
    const links = wrapper.findAll('.landing-nav a')
    expect(links.map((a) => a.text())).toEqual(NAV_LINKS.map((l) => l.label))
    for (const a of links) {
      const hash = a.attributes('href').split('#')[1]
      expect(wrapper.find(`#${hash}`).exists(), hash).toBe(true)
    }
  })

  it('CTA: sebelum sesi dimuat "Masuk", tamu "Masuk", pengguna login "Buka Dashboard"', async () => {
    const wrapper = await mountPage()
    const auth = useAuthStore()
    const cta = () => wrapper.find('[data-cta]')
    expect(auth.initialized).toBe(false)
    expect(cta().text()).toContain('Masuk')
    expect(cta().attributes('href')).toBe('/login')

    auth.initialized = true
    await flushPromises()
    expect(cta().text()).toContain('Masuk')

    auth.accessToken = 'token'
    auth.user = { id: '1', name: 'Guru' }
    await flushPromises()
    expect(cta().text()).toContain('Buka Dashboard')
    expect(cta().attributes('href')).toBe('/dashboard')
  })

  it('tanpa env kontak bagian kontak tidak dirender; footer memakai tahun berjalan', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('#kontak').exists()).toBe(false)
    expect(wrapper.find('[data-footer-copy]').text()).toContain(String(new Date().getFullYear()))
  })

  it('urutan judul tidak melompat (h1 lalu h2, …)', async () => {
    const wrapper = await mountPage()
    const levels = wrapper
      .findAll('h1, h2, h3, h4, h5, h6')
      .map((h) => Number(h.element.tagName[1]))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1], `judul ke-${i}`).toBeLessThanOrEqual(1)
    }
    expect(levels.filter((l) => l === 1)).toHaveLength(1)
  })

  it('tanpa pelanggaran aksesibilitas serius atau kritis (axe)', async () => {
    const wrapper = await mountPage({ attach: true })
    const result = await axe.run(wrapper.element, {
      // jsdom tidak menghitung warna/tata letak.
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    const serious = result.violations
      .filter((v) => ['serious', 'critical'].includes(v.impact))
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
    expect(serious).toEqual([])
    wrapper.unmount()
  })
})

describe('ContactSection', () => {
  const mountContact = () => mount(ContactSection, { global: { plugins: [PrimeVue] } })

  it('tautan email dan WhatsApp dari env', () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', 'info@sekolah.sch.id')
    vi.stubEnv('VITE_CONTACT_WHATSAPP', '628123456789')
    const wrapper = mountContact()
    expect(wrapper.find('[data-contact="email"]').attributes('href')).toMatch(
      /^mailto:info@sekolah\.sch\.id\?subject=Informasi%20/,
    )
    const wa = wrapper.find('[data-contact="whatsapp"]')
    expect(wa.attributes('href')).toMatch(/^https:\/\/wa\.me\/628123456789\?text=Halo%2C%20/)
    expect(wa.attributes('rel')).toBe('noopener noreferrer')
  })

  it('nomor WhatsApp yang bukan angka saja tidak menghasilkan tautan', () => {
    vi.stubEnv('VITE_CONTACT_WHATSAPP', '+62 812-3456')
    vi.stubEnv('VITE_CONTACT_EMAIL', '')
    const wrapper = mountContact()
    expect(wrapper.find('[data-contact="whatsapp"]').exists()).toBe(false)
    expect(wrapper.find('[data-contact="email"]').exists()).toBe(false)
  })

  it('halaman merender bagian kontak bila env diisi', async () => {
    vi.stubEnv('VITE_CONTACT_EMAIL', 'info@sekolah.sch.id')
    const wrapper = await mountPage()
    expect(wrapper.find('#kontak').exists()).toBe(true)
  })
})
