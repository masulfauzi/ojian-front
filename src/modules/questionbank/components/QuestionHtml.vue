<script setup>
import { ref, watch } from 'vue'
import RichTextViewer from '@/shared/components/RichTextViewer.vue'
import { mediaIdsIn } from '@/shared/utils/mediaHtml'
import { resolveMediaHtml } from '../composables/useMediaResolver'

// HTML soal: gambar unggahan (data-media-id) diisi URL bertanda tangan, lalu dirender aman.
const props = defineProps({
  html: { type: String, default: '' },
  schoolId: { type: String, default: null },
  inline: { type: Boolean, default: false },
})

const resolved = ref(props.html)

watch(
  () => [props.html, props.schoolId],
  async ([html]) => {
    resolved.value = html
    if (mediaIdsIn(html).length)
      resolved.value = await resolveMediaHtml(html, { schoolId: props.schoolId })
  },
  { immediate: true },
)
</script>

<template>
  <RichTextViewer :html="resolved" :class="{ 'rich-text--inline': inline }" />
</template>
