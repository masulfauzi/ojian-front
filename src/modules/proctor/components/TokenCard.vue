<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import { useClipboard } from '@/shared/composables/useClipboard'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useCountdown } from '@/shared/composables/useCountdown'
import { useNotify } from '@/shared/composables/useNotify'
import { formatDuration } from '@/shared/utils/zonedTime'
import { getToken, regenerateToken } from '../api/proctor.api'

// Token yang berlaku + hitung mundur pergantian. Saat habis, token baru diambil dari server
// (token dihitung server dari rahasia + waktu; tidak pernah dihitung di klien).
const props = defineProps({
  scheduleId: { type: String, required: true },
  schoolId: { type: String, default: null },
  canRegenerate: { type: Boolean, default: false },
})
const notify = useNotify()
const { ask } = useConfirm()
const { copy } = useClipboard()

const token = ref(null)
const error = ref(null)
const busy = ref(false)
const countdown = useCountdown({ onExpire: () => load() })

const progress = computed(() => {
  if (!token.value?.rotateMinutes || countdown.seconds.value === null) return null
  return Math.round((countdown.seconds.value / (token.value.rotateMinutes * 60)) * 100)
})

async function load() {
  try {
    token.value = await getToken(props.scheduleId, { schoolId: props.schoolId })
    error.value = null
    // +1 detik agar pengambilan berikutnya jatuh setelah pergantian di server.
    countdown.sync(token.value.secondsLeft === null ? null : token.value.secondsLeft + 1)
  } catch (err) {
    error.value = err
  }
}

async function regenerate() {
  const ok = await ask({
    header: 'Buat token baru',
    message:
      'Token lama langsung tidak berlaku. Siswa yang sudah mulai mengerjakan tidak terpengaruh. Lanjutkan?',
    acceptLabel: 'Buat token baru',
  })
  if (!ok) return
  busy.value = true
  try {
    token.value = await regenerateToken(props.scheduleId, { schoolId: props.schoolId })
    countdown.sync(token.value.secondsLeft === null ? null : token.value.secondsLeft + 1)
    notify.success('Token baru dibuat')
  } catch (err) {
    notify.error(err)
  } finally {
    busy.value = false
  }
}

const copyToken = () => copy(token.value.token, 'Token')

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <Card class="token-card">
    <template #title>Token ujian</template>
    <template #content>
      <p v-if="error" class="text-muted">{{ error.message }}</p>
      <div v-else-if="token" class="form-stack">
        <button
          type="button"
          class="token-card__value"
          :aria-label="`Token ${token.token.split('').join(' ')}, klik untuk menyalin`"
          @click="copyToken"
        >
          {{ token.token }}
        </button>
        <template v-if="token.rotateMinutes">
          <ProgressBar :value="progress" :show-value="false" class="token-card__bar" />
          <small class="text-muted"
            >Berganti dalam {{ formatDuration(countdown.seconds.value) }} (tiap
            {{ token.rotateMinutes }} menit). Token sebelumnya masih diterima satu periode.</small
          >
        </template>
        <small v-else class="text-muted">Token tetap selama jadwal berlangsung.</small>
        <Button
          v-if="canRegenerate"
          label="Buat token baru"
          icon="pi pi-refresh"
          size="small"
          severity="secondary"
          outlined
          :loading="busy"
          @click="regenerate"
        />
      </div>
    </template>
  </Card>
</template>
