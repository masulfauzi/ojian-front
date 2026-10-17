<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import { useNotify } from '@/shared/composables/useNotify'
import { fileSize, isImage, isPdf } from '../utils/files'

// Berkas bukti izin. URL bertanda tangan diambil saat dibuka (berumur pendek, tidak disimpan).
const props = defineProps({
  /** [{ mediaId, originalName, mimeType, sizeBytes }] */
  files: { type: Array, default: () => [] },
  /** async (mediaId) → { url } */
  resolveUrl: { type: Function, required: true },
  /** Tampilkan pratinjau gambar langsung di bawah daftar. */
  preview: { type: Boolean, default: false },
})
const notify = useNotify()

const previews = ref({})
const opening = ref(null)

async function open(file) {
  opening.value = file.mediaId
  try {
    const { url } = await props.resolveUrl(file.mediaId)
    if (props.preview && isImage(file.mimeType))
      previews.value = { ...previews.value, [file.mediaId]: url }
    else window.open(url, '_blank', 'noopener')
  } catch (error) {
    notify.error(error)
  } finally {
    opening.value = null
  }
}

const icon = (file) =>
  isPdf(file.mimeType) ? 'pi pi-file-pdf' : isImage(file.mimeType) ? 'pi pi-image' : 'pi pi-file'
</script>

<template>
  <div class="leave-files">
    <p v-if="!files.length" class="text-muted">Tanpa bukti.</p>
    <ul v-else class="plain-list leave-files__list">
      <li v-for="file in files" :key="file.mediaId" class="leave-files__item">
        <i :class="icon(file)" aria-hidden="true" />
        <span class="leave-files__name">{{ file.originalName }}</span>
        <span class="text-muted">{{ fileSize(file.sizeBytes) }}</span>
        <Button
          :label="
            isPdf(file.mimeType) ? 'Unduh' : preview && isImage(file.mimeType) ? 'Lihat' : 'Buka'
          "
          :icon="isPdf(file.mimeType) ? 'pi pi-download' : 'pi pi-eye'"
          size="small"
          text
          :loading="opening === file.mediaId"
          @click="open(file)"
        />
        <img
          v-if="previews[file.mediaId]"
          :src="previews[file.mediaId]"
          :alt="`Bukti ${file.originalName}`"
          class="leave-files__preview"
        />
      </li>
    </ul>
  </div>
</template>
