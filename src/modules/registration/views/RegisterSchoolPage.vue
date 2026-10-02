<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Step from 'primevue/step'
import StepList from 'primevue/steplist'
import StepPanel from 'primevue/steppanel'
import StepPanels from 'primevue/steppanels'
import Stepper from 'primevue/stepper'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { useAuthStore } from '@/modules/auth'
import { checkNpsn, conflictField, registerSchool } from '../api/registration.api'
import AdminStep from '../components/AdminStep.vue'
import NpsnStep from '../components/NpsnStep.vue'
import SchoolStep from '../components/SchoolStep.vue'
import {
  STEP_FIELDS,
  emptyRegistration,
  registrationSchema,
  stepOfFields,
} from '../schemas/registration.schema'

const LAST_STEP = STEP_FIELDS.length

const auth = useAuthStore()
const router = useRouter()
const notify = useNotify()

const form = useForm({
  validationSchema: toTypedSchema(registrationSchema),
  initialValues: emptyRegistration(),
  // Panel langkah yang tidak aktif dilepas; nilainya harus tetap tersimpan.
  keepValuesOnUnmount: true,
})
const applyServerErrors = useServerErrors(form, { statusFields: { 409: conflictField } })

const step = ref(1)
const formError = ref('')

// ---- Langkah 1: cek NPSN ----
const npsnStatus = ref('idle')
const checkedNpsn = ref(null)

// NPSN diubah setelah dicek: wajib dicek ulang.
watch(
  () => form.values.npsn,
  (npsn) => {
    if (npsn !== checkedNpsn.value) npsnStatus.value = 'idle'
  },
)

async function verifyNpsn() {
  formError.value = ''
  const { valid } = await form.validateField('npsn')
  if (!valid) return false
  const npsn = form.values.npsn.trim()
  npsnStatus.value = 'checking'
  try {
    const result = await checkNpsn(npsn)
    checkedNpsn.value = npsn
    npsnStatus.value = result.registered ? 'registered' : 'available'
    return !result.registered
  } catch (error) {
    npsnStatus.value = 'idle'
    if (!applyServerErrors(error)) formError.value = error.message
    return false
  }
}

// ---- Navigasi langkah ----
async function validateStep(number) {
  const results = await Promise.all(STEP_FIELDS[number - 1].map((f) => form.validateField(f)))
  return results.every((result) => result.valid)
}

async function next() {
  const ok =
    step.value === 1
      ? (npsnStatus.value === 'available' && checkedNpsn.value === form.values.npsn.trim()) ||
        (await verifyNpsn())
      : await validateStep(step.value)
  if (ok) step.value += 1
}

const back = () => (step.value -= 1)

/** Tampilkan langkah pertama yang memuat field bermasalah. */
function showStepWithErrors(fields) {
  const target = stepOfFields(fields)
  if (target) step.value = target
}

// ---- Daftar ----
const submit = form.handleSubmit(
  async (values) => {
    formError.value = ''
    try {
      const session = await registerSchool(values)
      await auth.startSession(session)
      notify.success(
        `${values.schoolName} berhasil didaftarkan. Selamat datang!`,
        'Registrasi berhasil',
      )
      await router.replace(auth.homeRoute())
    } catch (error) {
      if (applyServerErrors(error)) {
        if (conflictField(error) === 'npsn') npsnStatus.value = 'registered'
        showStepWithErrors(Object.keys(form.errors.value))
      } else {
        formError.value = error.message
      }
    }
  },
  ({ errors }) => showStepWithErrors(Object.keys(errors)),
)

// Tombol "Lanjut" adalah tombol submit agar Enter berfungsi di setiap langkah;
// di langkah 1–2 submit berarti lanjut, di langkah terakhir berarti daftar.
function onFormSubmit(event) {
  if (step.value === LAST_STEP) return submit(event)
  event.preventDefault()
  return next()
}

const summary = computed(() => ({
  npsn: form.values.npsn,
  schoolName: form.values.schoolName,
  educationLevel: form.values.educationLevel,
}))
</script>

<template>
  <div class="auth-card registration-card">
    <div class="auth-card__header">
      <i class="pi pi-building auth-card__logo" aria-hidden="true" />
      <h1 class="auth-card__title">Registrasi sekolah</h1>
      <p class="auth-card__subtitle">
        Daftarkan sekolah Anda dan buat akun admin sekolah. Setelah terdaftar Anda langsung masuk.
      </p>
    </div>

    <Message v-if="formError" severity="error" :closable="false" class="registration-error">
      {{ formError }}
    </Message>

    <form novalidate @submit="onFormSubmit">
      <Stepper v-model:value="step" linear>
        <StepList>
          <Step :value="1">NPSN</Step>
          <Step :value="2">Data sekolah</Step>
          <Step :value="3">Akun admin</Step>
        </StepList>
        <StepPanels>
          <StepPanel :value="1">
            <NpsnStep :status="npsnStatus" @check="verifyNpsn" />
          </StepPanel>
          <StepPanel :value="2">
            <SchoolStep />
          </StepPanel>
          <StepPanel :value="3">
            <AdminStep :summary="summary" />
          </StepPanel>
        </StepPanels>
      </Stepper>

      <div class="registration-actions">
        <Button
          v-if="step > 1"
          type="button"
          label="Kembali"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          :disabled="form.isSubmitting.value"
          @click="back"
        />
        <span class="registration-actions__spacer" />
        <Button
          v-if="step < LAST_STEP"
          type="submit"
          label="Lanjut"
          icon="pi pi-arrow-right"
          icon-pos="right"
          :loading="npsnStatus === 'checking'"
          :disabled="npsnStatus === 'registered' && step === 1"
        />
        <Button
          v-else
          type="submit"
          label="Daftarkan sekolah"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </form>

    <p class="auth-card__footer">
      Sudah punya akun? <RouterLink :to="{ name: 'login' }">Masuk</RouterLink>
    </p>
  </div>
</template>
