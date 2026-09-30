<script setup>
import { computed } from 'vue'
import { sanitizeRichText } from '@/shared/utils/sanitize'

const props = defineProps({
  html: { type: String, default: '' },
})

// Sanitasi SEBELUM v-html. Rumus (data-type="inline-math"/"block-math") dirender KaTeX.
const safeHtml = computed(() => sanitizeRichText(props.html))
</script>

<template>
  <div class="rich-text" v-html="safeHtml" />
</template>
