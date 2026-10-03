<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { useClipboard } from '@/shared/composables/useClipboard'
import { downloadCsv } from '@/shared/utils/download'

const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  /** Akun yang baru dibuat: { name, username, password } */
  account: { type: Object, default: null },
})

const { copy } = useClipboard()

const download = (account) =>
  downloadCsv(
    [account],
    [
      { key: 'name', label: 'Nama' },
      { key: 'username', label: 'Username (NISN)' },
      { key: 'password', label: 'Password awal' },
    ],
    `password-awal-${account.username}.csv`,
  )
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Akun siswa dibuat"
    :style="{ width: 'min(30rem, calc(100vw - 2rem))' }"
    modal
  >
    <div v-if="account" class="form-stack">
      <Message severity="warn" :closable="false">
        Password awal hanya ditampilkan sekali. Salin atau unduh sekarang dan berikan kepada siswa.
      </Message>
      <dl class="summary-list">
        <dt>Nama</dt>
        <dd>{{ account.name }}</dd>
        <dt>Username</dt>
        <dd>
          <code>{{ account.username }}</code>
          <Button
            icon="pi pi-copy"
            text
            rounded
            size="small"
            aria-label="Salin username"
            @click="copy(account.username, 'Username')"
          />
        </dd>
        <dt>Password awal</dt>
        <dd>
          <code class="password-value">{{ account.password }}</code>
          <Button
            icon="pi pi-copy"
            text
            rounded
            size="small"
            aria-label="Salin password"
            @click="copy(account.password, 'Password')"
          />
        </dd>
      </dl>
      <p class="text-muted" style="margin: 0">Siswa wajib mengganti password saat login pertama.</p>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Unduh CSV"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="download(account)"
        />
        <Button label="Selesai" icon="pi pi-check" @click="visible = false" />
      </div>
    </template>
  </Dialog>
</template>
