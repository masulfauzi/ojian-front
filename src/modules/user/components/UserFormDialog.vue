<script setup>
import { computed, ref, useId, watch } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import FormField from '@/shared/components/form/FormField.vue'
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormMultiSelect from '@/shared/components/form/FormMultiSelect.vue'
import FormPassword from '@/shared/components/form/FormPassword.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormSwitch from '@/shared/components/form/FormSwitch.vue'
import { useNotify } from '@/shared/composables/useNotify'
import { useServerErrors } from '@/shared/composables/useServerErrors'
import { PASSWORD_MAX, PASSWORD_MIN } from '@/shared/schemas/common'
import { listRoleOptions } from '@/modules/role'
import { SchoolSelect } from '@/modules/school'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'
import { assignableRoles, hasAdminRole, hasStudentRole, keepAvailable } from '../utils/roles'

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
  /** null = mode tambah; objek user = mode ubah. */
  user: { type: Object, default: null },
  /** Pengguna platform boleh memilih sekolah (kosong = pengguna platform). */
  chooseSchool: { type: Boolean, default: false },
  /** Sekolah bawaan untuk user baru (sekolah admin yang login), null untuk pengguna platform. */
  defaultSchoolId: { type: String, default: null },
  /** async (values) => void. Dialog menutup sendiri bila berhasil. */
  submit: { type: Function, required: true },
})

const isEdit = computed(() => Boolean(props.user))

// Opsi role (bergantung pada sekolah); kodenya dipakai aturan identitas login di skema.
const roleOptions = ref([])
const roleCodesOf = (ids = []) =>
  roleOptions.value.filter((role) => ids.includes(role.id)).map((role) => role.code)

const form = useForm({
  validationSchema: computed(() => {
    const factory = isEdit.value ? updateUserSchema : createUserSchema
    return toTypedSchema(factory({ roleCodesOf }))
  }),
})
// 409: username atau email sudah dipakai (dibedakan dari pesan backend).
const applyServerErrors = useServerErrors(form, {
  statusFields: { 409: (error) => (/email/i.test(error.message) ? 'email' : 'username') },
})
const notify = useNotify()

const schoolFieldId = useId()
const school = useField('schoolId')

// ---- Opsi role, bergantung pada sekolah ----
const rolesLoading = ref(false)
let rolesSeq = 0

async function loadRoles(schoolId) {
  const seq = ++rolesSeq
  rolesLoading.value = true
  try {
    const roles = assignableRoles(await listRoleOptions(schoolId), schoolId)
    if (seq !== rolesSeq) return
    roleOptions.value = roles
    // Role yang tidak berlaku untuk sekolah baru dibuang dari pilihan.
    const kept = keepAvailable(form.values.roleIds, roles)
    if (kept.length !== (form.values.roleIds ?? []).length) form.setFieldValue('roleIds', kept)
  } catch (error) {
    if (seq === rolesSeq) notify.error(error)
  } finally {
    if (seq === rolesSeq) rolesLoading.value = false
  }
}

watch(
  () => form.values.schoolId,
  (schoolId) => visible.value && loadRoles(schoolId ?? null),
)

// Siswa login dengan NISN, admin login dengan email.
const selectedCodes = computed(() => roleCodesOf(form.values.roleIds ?? []))
const needsEmail = computed(() => hasAdminRole(selectedCodes.value))
const usernameHint = computed(() =>
  hasStudentRole(selectedCodes.value)
    ? 'Siswa wajib memakai NISN 10 digit sebagai username.'
    : 'Unik di seluruh platform. Siswa wajib NISN 10 digit; guru boleh NIP atau nama login.',
)

// Role default dipilih dari role yang dicentang.
const defaultRoleOptions = computed(() =>
  roleOptions.value.filter((role) => (form.values.roleIds ?? []).includes(role.id)),
)
watch(
  () => form.values.roleIds,
  (roleIds) => {
    if (form.values.defaultRoleId && !(roleIds ?? []).includes(form.values.defaultRoleId)) {
      form.setFieldValue('defaultRoleId', null)
    }
  },
)

function initialValues() {
  if (props.user) {
    const { name, username, email, phone, schoolId, roles, isActive } = props.user
    return {
      name,
      username,
      email: email ?? '',
      phone: phone ?? '',
      schoolId,
      roleIds: roles.map((role) => role.id),
      defaultRoleId: roles.find((role) => role.isDefault)?.id ?? null,
      isActive,
    }
  }
  return {
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    schoolId: props.defaultSchoolId,
    roleIds: [],
    defaultRoleId: null,
  }
}

watch(visible, (open) => {
  if (!open) return
  const values = initialValues()
  form.resetForm({ values })
  loadRoles(values.schoolId ?? null)
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await props.submit(values)
    visible.value = false
  } catch (error) {
    if (!applyServerErrors(error)) notify.error(error)
  }
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEdit ? 'Ubah pengguna' : 'Tambah pengguna'"
    :style="{ width: 'min(44rem, calc(100vw - 2rem))' }"
    :closable="!form.isSubmitting.value"
    modal
  >
    <form id="user-form" class="form-grid" novalidate @submit="onSubmit">
      <FormInputText class="form-grid__full" name="name" label="Nama lengkap" required />
      <FormInputText
        name="username"
        label="Username"
        placeholder="NISN, NIP, atau nama login"
        :hint="usernameHint"
        autocomplete="off"
        required
      />
      <FormInputText
        name="email"
        label="Email"
        type="email"
        :hint="needsEmail ? 'Wajib untuk admin — admin login dengan email.' : 'Opsional.'"
        :required="needsEmail"
        autocomplete="off"
      />
      <FormInputText name="phone" label="Telepon" />
      <FormPassword
        v-if="!isEdit"
        name="password"
        label="Password awal"
        autocomplete="new-password"
        :hint="`${PASSWORD_MIN}–${PASSWORD_MAX} karakter. Wajib diganti saat login pertama.`"
        required
      />
      <div v-else />

      <FormField
        v-if="chooseSchool"
        :id="schoolFieldId"
        class="form-grid__full"
        label="Sekolah"
        :error="school.errorMessage.value"
        hint="Kosongkan untuk pengguna platform (hanya role Super Admin)."
      >
        <SchoolSelect
          v-model="school.value.value"
          :input-id="schoolFieldId"
          :invalid="!!school.errorMessage.value"
          placeholder="Pengguna platform (tanpa sekolah)"
          active-only
        />
      </FormField>

      <FormMultiSelect
        name="roleIds"
        label="Role"
        :options="roleOptions"
        option-label="name"
        option-value="id"
        :loading="rolesLoading"
        placeholder="Pilih role"
        required
      />
      <FormSelect
        name="defaultRoleId"
        label="Role default"
        :options="defaultRoleOptions"
        option-label="name"
        option-value="id"
        placeholder="Role pertama"
        hint="Role aktif saat login."
        show-clear
      />
      <FormSwitch v-if="isEdit" name="isActive" label="Status" />
    </form>

    <Message
      v-if="isEdit && user?.mustChangePassword"
      severity="warn"
      :closable="false"
      style="margin-top: 1rem"
    >
      Pengguna ini belum mengganti password awal.
    </Message>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Batal"
          severity="secondary"
          outlined
          :disabled="form.isSubmitting.value"
          @click="visible = false"
        />
        <Button
          type="submit"
          form="user-form"
          :label="isEdit ? 'Simpan' : 'Tambah'"
          icon="pi pi-check"
          :loading="form.isSubmitting.value"
          :disabled="form.isSubmitting.value"
        />
      </div>
    </template>
  </Dialog>
</template>
