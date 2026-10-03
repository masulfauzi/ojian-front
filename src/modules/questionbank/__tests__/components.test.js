import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import ChoicePreview from '../components/preview/ChoicePreview.vue'
import SingleChoiceEditor from '../components/editors/SingleChoiceEditor.vue'
import { typeOf } from '../types/definitions'

const global = { plugins: [PrimeVue, ToastService], directives: { tooltip: Tooltip } }

const content = {
  prompt: '<p>Soal</p>',
  options: [
    { id: 'o2', text: '<p>B</p>' },
    { id: 'o1', text: '<p>A</p>' },
    { id: 'o3', text: '<p>C</p>' },
  ],
  max_select: 2,
}

describe('ChoicePreview', () => {
  it('pilihan tunggal: klik menetapkan answer.selected', async () => {
    const wrapper = mount(ChoicePreview, { props: { content, answer: null }, global })
    await wrapper.findAll('button.choice')[1].trigger('click')
    expect(wrapper.emitted('update:answer').at(-1)).toEqual([{ selected: 'o1' }])
  })

  it('pilihan ganda: menambah/membatalkan dan menghormati max_select', async () => {
    const wrapper = mount(ChoicePreview, {
      props: {
        content,
        multiple: true,
        answer: { selected: ['o2', 'o1'] },
        'onUpdate:answer': () => {},
      },
      global,
    })
    await wrapper.findAll('button.choice')[2].trigger('click')
    expect(wrapper.emitted('update:answer')).toBeUndefined()
    await wrapper.findAll('button.choice')[0].trigger('click')
    expect(wrapper.emitted('update:answer').at(-1)).toEqual([{ selected: ['o1'] }])
  })
})

describe('SingleChoiceEditor', () => {
  it('memilih radio menandai jawaban benar; error path tampil', async () => {
    const wrapper = mount(SingleChoiceEditor, {
      props: {
        modelValue: typeOf('single_choice').empty(),
        errors: { 'answer_key.correct': 'harus ID salah satu opsi' },
      },
      global,
    })
    expect(wrapper.text()).toContain('harus ID salah satu opsi')
    await wrapper.findAll('input[type="radio"]')[2].setValue(true)
    const emitted = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(emitted.answerKey).toEqual({ correct: 'o3' })
    wrapper.unmount()
  })
})
