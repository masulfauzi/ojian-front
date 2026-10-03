<script setup>
import { ref, watch } from 'vue'
import RichTextViewer from '@/shared/components/RichTextViewer.vue'
import { mediaIdsIn, withMediaUrls } from '@/shared/utils/mediaHtml'
import { useAuthStore } from '@/modules/auth'
import { resolveMediaHtml } from '../composables/useMediaResolver'

// HTML soal: gambar unggahan (data-media-id) diisi URL bertanda tangan, lalu dirender aman.
// GET /media/{id} memerlukan hak lihat bank soal; pengguna tanpa hak itu (siswa saat ujian)
// tidak memanggilnya dan melihat placeholder "Gambar tidak dapat dimuat".
const props = defineProps({
  html: { type: String, default: '' },
  schoolId: { type: String, default: null },
  inline: { type: Boolean, default: false },
})

const auth = useAuthStore()
const resolved = ref(props.html)

watch(
  () => [props.html, props.schoolId],
  async ([html]) => {
    resolved.value = html
    if (!mediaIdsIn(html).length) return
    resolved.value = auth.can('question_bank')
      ? await resolveMediaHtml(html, { schoolId: props.schoolId })
      : withMediaUrls(html, {})
  },
  { immediate: true },
)
</script>

<template>
  <RichTextViewer :html="resolved" :class="{ 'rich-text--inline': inline }" />
</template>
