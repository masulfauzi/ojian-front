<script setup>
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmDialog :style="{ width: 'min(28rem, calc(100vw - 2rem))' }" />
</template>
