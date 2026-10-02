<script setup>
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormInputText from '@/shared/components/form/FormInputText.vue'

defineProps({
  /** 'idle' | 'checking' | 'available' | 'registered' */
  status: { type: String, default: 'idle' },
})

const emit = defineEmits(['check'])
</script>

<template>
  <div class="form-stack">
    <p class="text-muted registration-intro">
      Masukkan NPSN sekolah Anda. Satu NPSN hanya dapat didaftarkan satu kali, dan NPSN juga dipakai
      sebagai kode sekolah.
    </p>
    <div class="registration-npsn">
      <FormInputText
        name="npsn"
        label="NPSN"
        placeholder="8 digit angka, mis. 20100001"
        autocomplete="off"
        required
      />
      <Button
        type="button"
        label="Periksa"
        icon="pi pi-search"
        severity="secondary"
        outlined
        :loading="status === 'checking'"
        @click="emit('check')"
      />
    </div>

    <Message v-if="status === 'available'" severity="success" :closable="false" icon="pi pi-check">
      NPSN tersedia. Lanjutkan untuk mengisi data sekolah.
    </Message>
    <Message v-else-if="status === 'registered'" severity="warn" :closable="false">
      NPSN ini sudah terdaftar. Hubungi admin sekolah Anda atau administrator platform, atau
      <RouterLink :to="{ name: 'login' }">masuk</RouterLink> bila Anda sudah punya akun.
    </Message>
  </div>
</template>
