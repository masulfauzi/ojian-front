<script setup>
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useNotify } from '@/shared/composables/useNotify'
import { KATEX_OPTIONS, renderMathToString } from '@/shared/utils/math'

// Gambar unggahan direferensikan lewat data-media-id (URL bertanda tangan bisa kedaluwarsa,
// jadi pemanggil membuang src sebelum menyimpan dan mengisinya lagi saat menampilkan).
const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-media-id'),
        renderHTML: (attrs) => (attrs.mediaId ? { 'data-media-id': attrs.mediaId } : {}),
      },
    }
  },
})

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  placeholder: { type: String, default: 'Tulis di sini…' },
  disabled: { type: Boolean, default: false },
  /** Tinggi minimal area tulis; default 10rem, atau 2.5rem pada mode ringkas. */
  minHeight: { type: String, default: null },
  /** Toolbar ringkas untuk isian pendek (opsi, pernyataan). */
  compact: { type: Boolean, default: false },
  /**
   * Unggah gambar: async (file) => ({ mediaId, url }). Bila diisi, tombol gambar membuka
   * pemilih file; bila tidak, gambar disisipkan lewat URL.
   */
  uploadImage: { type: Function, default: null },
})

const notify = useNotify()
const fileInput = ref()
const uploading = ref(false)
const areaHeight = computed(() => props.minHeight ?? (props.compact ? '2.5rem' : '10rem'))

// ---- Dialog sisip gambar / rumus ----
const dialog = reactive({
  visible: false,
  kind: 'image', // 'image' | 'inline-math' | 'block-math'
  value: '',
  pos: null, // posisi node rumus saat mengubah rumus yang sudah ada
})

const dialogTitle = computed(
  () =>
    ({
      image: 'Sisipkan gambar',
      'inline-math': 'Rumus inline',
      'block-math': 'Rumus blok',
    })[dialog.kind],
)

const mathPreview = computed(() =>
  dialog.kind === 'image' ? '' : renderMathToString(dialog.value, dialog.kind === 'block-math'),
)

function openDialog(kind, value = '', pos = null) {
  Object.assign(dialog, { visible: true, kind, value, pos })
}

// ---- Editor ----
const editor = shallowRef(
  new Editor({
    content: model.value,
    editable: !props.disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      MediaImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: () => props.placeholder }),
      // Klik rumus untuk mengubahnya. Rumus blok memakai displayMode agar sama dengan RichTextViewer.
      InlineMath.configure({
        katexOptions: KATEX_OPTIONS,
        onClick: (node, pos) => openDialog('inline-math', node.attrs.latex, pos),
      }),
      BlockMath.configure({
        katexOptions: { ...KATEX_OPTIONS, displayMode: true },
        onClick: (node, pos) => openDialog('block-math', node.attrs.latex, pos),
      }),
    ],
    onUpdate: ({ editor: instance }) => {
      model.value = instance.isEmpty ? '' : instance.getHTML()
    },
  }),
)

// Sinkron nilai dari luar (mis. reset form) tanpa memicu onUpdate.
watch(model, (value) => {
  const instance = editor.value
  if (!instance) return
  const current = instance.isEmpty ? '' : instance.getHTML()
  if ((value ?? '') !== current) instance.commands.setContent(value ?? '', { emitUpdate: false })
})

watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled),
)

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})

function applyDialog() {
  const value = dialog.value.trim()
  const chain = editor.value.chain().focus()
  if (value) {
    if (dialog.kind === 'image') chain.setImage({ src: value }).run()
    else if (dialog.kind === 'inline-math') {
      if (dialog.pos === null) chain.insertInlineMath({ latex: value }).run()
      else chain.updateInlineMath({ latex: value, pos: dialog.pos }).run()
    } else if (dialog.pos === null) chain.insertBlockMath({ latex: value }).run()
    else chain.updateBlockMath({ latex: value, pos: dialog.pos }).run()
  }
  dialog.visible = false
}

function removeMath() {
  const chain = editor.value.chain().focus()
  if (dialog.kind === 'inline-math') chain.deleteInlineMath({ pos: dialog.pos }).run()
  else chain.deleteBlockMath({ pos: dialog.pos }).run()
  dialog.visible = false
}

// ---- Gambar unggahan ----
async function onImagePicked(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploading.value = true
  try {
    const { mediaId, url } = await props.uploadImage(file)
    editor.value.chain().focus().setImage({ src: url, mediaId, alt: file.name }).run()
  } catch (error) {
    notify.error(error, 'Gagal mengunggah gambar')
  } finally {
    uploading.value = false
  }
}

/** Sisipkan teks di posisi kursor (mis. penanda rumpang {{b1}}). */
function insertText(text) {
  editor.value?.chain().focus().insertContent(text).run()
}

defineExpose({ insertText })

// ---- Toolbar ----
const allTools = [
  // primeicons tidak punya ikon tebal/miring/garis bawah, jadi dipakai huruf bergaya.
  { text: 'B', textClass: 'is-bold', label: 'Tebal', active: 'bold', run: (c) => c.toggleBold() },
  {
    text: 'I',
    textClass: 'is-italic',
    label: 'Miring',
    active: 'italic',
    run: (c) => c.toggleItalic(),
  },
  {
    text: 'U',
    textClass: 'is-underline',
    label: 'Garis bawah',
    active: 'underline',
    run: (c) => c.toggleUnderline(),
  },
  { separator: true },
  {
    icon: 'pi pi-list',
    label: 'Daftar berpoin',
    active: 'bulletList',
    run: (c) => c.toggleBulletList(),
  },
  {
    icon: 'pi pi-sort-numeric-down',
    label: 'Daftar bernomor',
    active: 'orderedList',
    run: (c) => c.toggleOrderedList(),
  },
  { separator: true },
  { icon: 'pi pi-image', label: 'Sisipkan gambar', image: true, compact: true },
  { text: 'ƒx', label: 'Sisipkan rumus inline', dialog: 'inline-math', compact: true },
  { text: '∑', label: 'Sisipkan rumus blok', dialog: 'block-math' },
  { separator: true },
  { icon: 'pi pi-undo', label: 'Urungkan', run: (c) => c.undo() },
  { icon: 'pi pi-refresh', label: 'Ulangi', run: (c) => c.redo() },
]

// Mode ringkas: hanya format dasar, gambar, dan rumus inline.
const COMPACT_ACTIVE = new Set(['bold', 'italic', 'underline'])
const tools = computed(() =>
  props.compact ? allTools.filter((t) => t.compact || COMPACT_ACTIVE.has(t.active)) : allTools,
)

function runTool(tool) {
  if (tool.image) return props.uploadImage ? fileInput.value.click() : openDialog('image')
  if (tool.dialog) return openDialog(tool.dialog)
  tool.run(editor.value.chain().focus()).run()
}

const isActive = (tool) => Boolean(tool.active && editor.value?.isActive(tool.active))
</script>

<template>
  <div class="rich-text-editor" :class="{ 'is-disabled': disabled, 'is-compact': compact }">
    <div class="rich-text-editor__toolbar" role="toolbar" aria-label="Format teks">
      <template v-for="(tool, index) in tools" :key="index">
        <span v-if="tool.separator" class="rich-text-editor__separator" aria-hidden="true" />
        <Button
          v-else
          v-tooltip.bottom="tool.label"
          :icon="tool.icon"
          :class="['rich-text-editor__tool', tool.textClass]"
          :label="tool.text"
          :aria-label="tool.label"
          :aria-pressed="tool.active ? isActive(tool) : undefined"
          :severity="isActive(tool) ? 'primary' : 'secondary'"
          :text="!isActive(tool)"
          :disabled="disabled || (tool.image && uploading)"
          :loading="tool.image && uploading"
          size="small"
          @mousedown.prevent
          @click="runTool(tool)"
        />
      </template>
    </div>

    <EditorContent
      :editor="editor"
      class="rich-text-editor__content rich-text"
      :style="{ minHeight: areaHeight }"
      @click="editor?.commands.focus()"
    />

    <input
      v-if="uploadImage"
      ref="fileInput"
      type="file"
      :accept="IMAGE_ACCEPT"
      hidden
      @change="onImagePicked"
    />

    <Dialog
      v-model:visible="dialog.visible"
      :header="dialogTitle"
      :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
      modal
    >
      <form class="form-stack" @submit.prevent="applyDialog">
        <template v-if="dialog.kind === 'image'">
          <label for="rte-image-url">URL gambar</label>
          <InputText
            id="rte-image-url"
            v-model="dialog.value"
            type="url"
            placeholder="https://contoh.com/gambar.png"
            autofocus
            fluid
          />
        </template>
        <template v-else>
          <label for="rte-latex">LaTeX</label>
          <Textarea
            id="rte-latex"
            v-model="dialog.value"
            rows="3"
            placeholder="\frac{a}{b}"
            class="code-block"
            autofocus
            fluid
          />
          <div class="text-muted">Pratinjau:</div>
          <div class="rich-text" v-html="mathPreview" />
        </template>

        <div class="dialog-footer">
          <Button
            v-if="dialog.kind !== 'image' && dialog.pos !== null"
            label="Hapus rumus"
            severity="danger"
            text
            @click="removeMath"
          />
          <Button label="Batal" severity="secondary" outlined @click="dialog.visible = false" />
          <Button type="submit" label="Sisipkan" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
