<template>
  <!-- Ilustrasi statis dari token tema: bukan tangkapan layar aplikasi. -->
  <div class="hero-mockup" aria-hidden="true">
    <div class="mock-card mock-exam">
      <div class="mock-exam__bar">
        <span class="mock-title">Ujian Informatika</span>
        <span class="mock-timer"><i class="pi pi-clock" /> 24:18</span>
      </div>
      <p class="mock-question">Soal 7 · Perangkat input adalah …</p>
      <ul class="mock-options">
        <li>A · Monitor</li>
        <li class="is-selected">B · Keyboard</li>
        <li>C · Printer</li>
      </ul>
      <div class="mock-nav">
        <span v-for="n in 10" :key="n" :class="{ 'is-done': n < 7, 'is-current': n === 7 }">{{
          n
        }}</span>
      </div>
    </div>
    <div class="mock-card mock-attendance">
      <i class="pi pi-check-circle" />
      <div>
        <span class="mock-title">Presensi pagi</span>
        <span class="mock-badge">Hadir · 06.42</span>
      </div>
    </div>
    <div class="mock-card mock-journal">
      <span class="mock-title"><i class="pi pi-book" /> Jurnal hari ini</span>
      <span class="mock-line">Jam 1–2 · X-1 · Informatika</span>
      <span class="mock-line is-muted">Materi: struktur percabangan</span>
    </div>
  </div>
</template>
