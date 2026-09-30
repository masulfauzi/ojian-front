<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import BaseChart from '@/shared/components/BaseChart.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import RichTextViewer from '@/shared/components/RichTextViewer.vue'
import SortableList from '@/shared/components/SortableList.vue'

// ---- 1. Editor ----
const editorHtml = ref(
  '<p>Hitung nilai <span data-type="inline-math" data-latex="\\frac{a}{b}"></span> bila ' +
    '<strong>a = 6</strong> dan <em>b = 3</em>.</p>' +
    '<div data-type="block-math" data-latex="\\sqrt{x^2+y^2}"></div>',
)

// ---- 2. Viewer + sanitasi ----
const sampleHtml = [
  '<p>Pecahan: <span data-type="inline-math" data-latex="\\frac{a}{b}"></span>, ',
  'akar: <span data-type="inline-math" data-latex="\\sqrt{x^2+y^2}"></span>.</p>',
  '<div data-type="block-math" data-latex="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}"></div>',
  '<ul><li>Daftar berpoin</li><li><u>Garis bawah</u></li></ul>',
  '<p>HTML berbahaya di bawah ini harus hilang:</p>',
  '<img src="x" onerror="alert(\'xss-img\')">',
  '<script>alert("xss-script")</' + 'script>',
  '<a href="javascript:alert(\'xss-link\')">tautan javascript:</a>',
  '<p onclick="alert(\'xss-click\')">Paragraf dengan onclick</p>',
].join('')

// ---- 3. Sortable ----
const steps = ref([
  { id: 1, label: 'Baca soal dengan teliti' },
  { id: 2, label: 'Tulis yang diketahui' },
  { id: 3, label: 'Pilih rumus yang sesuai' },
  { id: 4, label: 'Hitung dan periksa jawaban' },
])
const bankSoal = ref([
  { id: 'a', label: 'Soal A · Pecahan' },
  { id: 'b', label: 'Soal B · Akar' },
  { id: 'c', label: 'Soal C · Deret' },
])
const paketUjian = ref([{ id: 'd', label: 'Soal D · Persamaan linear' }])

// ---- 4. Chart ----
const barData = {
  labels: ['X-1', 'X-2', 'X-3', 'XI-1', 'XI-2'],
  datasets: [
    { label: 'Rata-rata nilai', data: [78, 82, 71, 88, 75], backgroundColor: '#10b981' },
    { label: 'KKM', data: [75, 75, 75, 75, 75], backgroundColor: '#cbd5e1' },
  ],
}
const lineData = {
  labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  datasets: [
    {
      label: 'Peserta ujian',
      data: [120, 180, 150, 210, 260, 90],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      fill: true,
      tension: 0.35,
    },
  ],
}
const chartOptions = { plugins: { legend: { position: 'bottom' } } }
</script>

<template>
  <div class="page" style="padding: 1.5rem">
    <PageHeader
      title="Playground"
      description="Halaman development untuk menguji integrasi TipTap, KaTeX, drag and drop, dan Chart.js."
    >
      <template #actions>
        <Tag severity="warn" value="Hanya development" icon="pi pi-wrench" />
      </template>
    </PageHeader>

    <Card>
      <template #title>1. RichTextEditor (TipTap + KaTeX)</template>
      <template #subtitle>Klik rumus untuk mengubahnya.</template>
      <template #content>
        <div class="form-stack">
          <RichTextEditor v-model="editorHtml" placeholder="Tulis soal di sini…" />
          <div class="grid-2">
            <div>
              <h3>HTML mentah</h3>
              <pre class="code-block" data-testid="raw-html">{{ editorHtml }}</pre>
            </div>
            <div>
              <h3>Hasil RichTextViewer</h3>
              <RichTextViewer :html="editorHtml" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>2. RichTextViewer + sanitasi DOMPurify</template>
      <template #content>
        <div class="grid-2">
          <div>
            <h3>Input (mengandung HTML berbahaya)</h3>
            <pre class="code-block">{{ sampleHtml }}</pre>
          </div>
          <div>
            <h3>Hasil render</h3>
            <RichTextViewer :html="sampleHtml" data-testid="viewer-sample" />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>3. SortableList (VueDraggablePlus)</template>
      <template #content>
        <div class="grid-2">
          <div>
            <h3>Urutkan lewat pegangan</h3>
            <SortableList v-model="steps" handle=".drag-handle">
              <template #item="{ item, index }">
                <div class="toolbar" style="padding: 0.6rem 0.75rem">
                  <i class="pi pi-bars drag-handle" aria-label="Seret" />
                  <span>{{ index + 1 }}. {{ item.label }}</span>
                </div>
              </template>
            </SortableList>
            <p class="text-muted">Urutan: {{ steps.map((s) => s.id).join(' → ') }}</p>
          </div>
          <div class="grid-2">
            <div>
              <h3>Bank soal</h3>
              <SortableList v-model="bankSoal" group="soal">
                <template #item="{ item }">
                  <div style="padding: 0.6rem 0.75rem; cursor: grab">{{ item.label }}</div>
                </template>
              </SortableList>
            </div>
            <div>
              <h3>Paket ujian</h3>
              <SortableList v-model="paketUjian" group="soal">
                <template #item="{ item }">
                  <div style="padding: 0.6rem 0.75rem; cursor: grab">{{ item.label }}</div>
                </template>
              </SortableList>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #title>4. BaseChart (Chart.js lewat Chart PrimeVue)</template>
      <template #content>
        <div class="grid-2">
          <BaseChart type="bar" :data="barData" :options="chartOptions" />
          <BaseChart type="line" :data="lineData" :options="chartOptions" />
        </div>
      </template>
    </Card>
  </div>
</template>
