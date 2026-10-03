import { computed } from 'vue'

/**
 * Akses model editor jenis soal `{ content, answerKey }` secara immutable.
 *
 *   const { content, key, patchContent, patchKey, errorAt } = useQuestionModel(props, emit)
 *
 * `props.errors` berisi pesan per path backend (mis. 'content.options[2].id').
 */
export function useQuestionModel(props, emit) {
  const content = computed(() => props.modelValue.content)
  const key = computed(() => props.modelValue.answerKey)

  const update = (next) => emit('update:modelValue', { ...props.modelValue, ...next })
  const patchContent = (patch) => update({ content: { ...content.value, ...patch } })
  const patchKey = (patch) => update({ answerKey: { ...key.value, ...patch } })
  const patchBoth = (contentPatch, keyPatch) =>
    update({
      content: { ...content.value, ...contentPatch },
      answerKey: { ...key.value, ...keyPatch },
    })

  /** Pesan untuk path persis, atau path di bawahnya (prefix). */
  const errorAt = (path) => {
    const errors = props.errors ?? {}
    if (errors[path]) return errors[path]
    const nested = Object.keys(errors).find(
      (p) => p.startsWith(`${path}.`) || p.startsWith(`${path}[`),
    )
    return nested ? errors[nested] : ''
  }

  return { content, key, update, patchContent, patchKey, patchBoth, errorAt }
}

/** Props bersama semua editor jenis soal. */
export const editorProps = {
  modelValue: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  uploadImage: { type: Function, default: null },
  /** Bobot soal (uraian: total rubrik harus sama). */
  points: { type: Number, default: 1 },
}
