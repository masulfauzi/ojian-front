<script setup>
import FormInputText from '@/shared/components/form/FormInputText.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import { EDUCATION_LEVEL_OPTIONS, OWNERSHIP_OPTIONS } from '@/modules/school'
</script>

<template>
  <div class="form-grid">
    <FormInputText
      class="form-grid__full"
      name="schoolName"
      label="Nama sekolah"
      placeholder="SMA Negeri 1 Jakarta"
      autocomplete="organization"
      required
    />
    <FormSelect
      name="educationLevel"
      label="Jenjang"
      :options="EDUCATION_LEVEL_OPTIONS"
      placeholder="Pilih jenjang"
      required
    />
    <FormSelect
      name="ownership"
      label="Status kepemilikan"
      :options="OWNERSHIP_OPTIONS"
      placeholder="Pilih"
      show-clear
    />
    <FormTextarea class="form-grid__full" name="address" label="Alamat" :rows="2" />
    <FormInputText name="city" label="Kota/Kabupaten" />
    <FormInputText name="province" label="Provinsi" />
    <FormInputText name="postalCode" label="Kode pos" />
    <FormInputText name="schoolPhone" label="Telepon sekolah" />
    <FormInputText
      class="form-grid__full"
      name="schoolEmail"
      label="Email sekolah"
      type="email"
      hint="Opsional. Email resmi sekolah, bukan email login admin."
    />
  </div>
</template>
