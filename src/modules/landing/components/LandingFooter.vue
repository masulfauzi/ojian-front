<script setup>
import { appName, orgName } from '../data/config'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="landing-footer">
    <div class="landing-container landing-footer__inner">
      <span class="landing-brand landing-brand--muted">
        <i class="pi pi-book" aria-hidden="true" />
        <span>{{ appName() }}</span>
      </span>
      <span class="landing-footer__copy" data-footer-copy>© {{ year }} {{ orgName() }}</span>
    </div>
  </footer>
</template>
