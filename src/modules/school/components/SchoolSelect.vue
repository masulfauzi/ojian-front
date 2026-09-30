<script setup>
import { onMounted, ref, watch } from 'vue'
import Select from 'primevue/select'
import { useDebounceFn } from '@/shared/composables/useDebounce'
import { getSchool, listSchools } from '../api/school.api'

/**
 * Pilih sekolah dengan pencarian di server (nama, kode, atau NPSN).
 * v-model: id sekolah atau null.
 */
const model = defineModel({ type: String, default: null })

const props = defineProps({
  placeholder: { type: String, default: 'Pilih sekolah' },
  inputId: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  showClear: { type: Boolean, default: true },
  /** Hanya tampilkan sekolah aktif (untuk memberi sekolah ke user/role). */
  activeOnly: { type: Boolean, default: false },
})

const options = ref([])
const loading = ref(false)

const toOption = (school) => ({ value: school.id, label: `${school.name} (${school.code})` })

async function search(term = '') {
  loading.value = true
  try {
    const { items } = await listSchools({
      limit: 20,
      search: term,
      isActive: props.activeOnly ? true : undefined,
    })
    const found = items.map(toOption)
    // Pertahankan sekolah yang sedang terpilih walau tidak ada di hasil pencarian.
    const selected = options.value.find((opt) => opt.value === model.value)
    options.value =
      selected && !found.some((o) => o.value === selected.value) ? [selected, ...found] : found
  } catch {
    options.value = []
  } finally {
    loading.value = false
  }
}

/** Pastikan label sekolah terpilih tersedia (mis. saat membuka form ubah). */
async function ensureSelected(id) {
  if (!id || options.value.some((opt) => opt.value === id)) return
  try {
    options.value = [toOption(await getSchool(id)), ...options.value]
  } catch {
    // Sekolah tidak ditemukan/tidak boleh dilihat: biarkan Select menampilkan placeholder.
  }
}

const onFilter = useDebounceFn((event) => search(event.value), 300)

onMounted(async () => {
  await search()
  await ensureSelected(model.value)
})
watch(model, ensureSelected)
</script>

<template>
  <Select
    v-model="model"
    :input-id="inputId"
    :options="options"
    option-label="label"
    option-value="value"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    :invalid="invalid"
    :show-clear="showClear"
    filter
    filter-placeholder="Cari nama, kode, atau NPSN"
    empty-filter-message="Sekolah tidak ditemukan"
    auto-filter-focus
    reset-filter-on-hide
    fluid
    @filter="onFilter"
  />
</template>
