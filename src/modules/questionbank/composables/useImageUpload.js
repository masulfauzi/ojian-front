import { uploadMedia } from '../api/media.api'
import { rememberMedia } from './useMediaResolver'

/** Fungsi unggah gambar untuk RichTextEditor: (file) → { mediaId, url }. */
export async function uploadQuestionImage(file) {
  const media = await uploadMedia(file)
  rememberMedia(media)
  return { mediaId: media.id, url: media.url }
}
