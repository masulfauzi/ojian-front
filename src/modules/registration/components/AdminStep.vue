<script setup>
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import { PASSWORD_MAX, PASSWORD_MIN } from '@/shared/schemas/common'

defineProps({
  /** Ringkasan data sekolah dari langkah sebelumnya. */
  summary: { type: Object, required: true },
})
</script>

<template>
  <div class="form-stack">
    <dl class="registration-summary">
      <dt>NPSN / kode sekolah</dt>
      <dd>{{ summary.npsn }}</dd>
      <dt>Sekolah</dt>
      <dd>{{ summary.schoolName }} · {{ summary.educationLevel }}</dd>
    </dl>

    <div class="form-grid">
      <FormInputText
        class="form-grid__full"
        name="adminName"
        label="Nama admin"
        autocomplete="name"
        required
      />
      <FormInputText
        name="adminEmail"
        label="Email admin"
        type="email"
        autocomplete="email"
        hint="Dipakai untuk masuk. Admin login dengan email."
        required
      />
      <FormInputText
        name="adminUsername"
        label="Username admin"
        autocomplete="username"
        placeholder="admin.sman1jkt"
        hint="Unik di seluruh platform."
        required
      />
      <FormInputText name="adminPhone" label="Telepon admin" autocomplete="tel" />
      <div />
      <FormPassword
        name="password"
        label="Password"
        autocomplete="new-password"
        :hint="`${PASSWORD_MIN}–${PASSWORD_MAX} karakter`"
        required
      />
      <FormPassword
        name="confirmPassword"
        label="Konfirmasi password"
        autocomplete="new-password"
        required
      />
    </div>
  </div>
</template>
