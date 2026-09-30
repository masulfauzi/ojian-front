# CLAUDE.md — exam-web

Vue 3 (JavaScript, `<script setup>`) + Vite 8, Pinia 3, Vue Router 4, PrimeVue 4 (Aura, impor eksplisit), VeeValidate 4 + Zod 3, TipTap 3, KaTeX, VueDraggablePlus, Chart.js, axios, DOMPurify. Tanpa Tailwind — gaya global di `src/styles/main.css`. Backend: `../ojian-back` (exam-api, Go); kontrak ada di `docs/swagger.yaml` di sana.

## Perintah

```bash
npm run dev      # port 5173 (CORS backend hanya mengizinkan origin ini)
npm run lint     # harus lulus; juga menegakkan batas modul
npm run test     # vitest + jsdom, file di src/**/__tests__/*.test.js
npm run build
```

Selalu jalankan `npm run lint && npm run test && npm run build` sebelum selesai.

## Aturan arsitektur

- **Satu fitur = satu folder** `src/modules/<nama>/` berisi `index.js`, `routes.js`, `menu.js`, `api/`, `stores/`, `schemas/`, `components/`, `views/`, `__tests__/`.
- **Alur berlapis**: view → store (Pinia) / composable → `api/<nama>.api.js` → `@/shared/api/http`. Hanya file `*.api.js` yang boleh memakai `http`/axios. Fungsi API mengembalikan data yang sudah dibuka (`unwrap`/`unwrapList`) dan sudah dipetakan snake_case → camelCase; pemetaan kontrak backend hanya di file ini (termasuk `remapFieldErrors`).
- **Komponen** hanya menampilkan data dan mengirim event. Form fitur menerima prop `submit` (async) dan memetakan error server ke field lewat `useServerErrors`.
- **Public API**: modul lain hanya mengimpor `@/modules/<nama>` (index.js), tidak pernah `@/modules/<nama>/...`. Di dalam satu modul pakai import relatif; lintas folder pakai `@/...`.
- **`shared/` generik**: dilarang mengimpor `@/modules/*` atau `@/app/*` (dijaga ESLint `no-restricted-imports`). Bila shared butuh sesuatu dari modul, sediakan titik pemasangan dan sambungkan di `app/bootstrap.js` (contoh: `setAuthHandlers`).
- **Registrasi otomatis**: `app/router/index.js` dan `app/menu.js` memakai `import.meta.glob` atas `modules/*/routes.js` dan `modules/*/menu.js` (export default array). Menambah modul **tidak** mengubah file di `app/`.
- Route: halaman selalu lazy (`() => import(...)`), `meta: { layout: 'auth' | 'dashboard' | 'blank', requiresAuth, roles?, title, guestOnly? }`. Menu: `{ label, icon, to, roles?, order? }`.
- Nama file: `PascalCase.vue`, `xxx.store.js`, `xxx.api.js`, `xxx.schema.js`, `useXxx.js`.
- Schema Zod mengimpor helper dari `@/shared/schemas/common` (memasang error map Indonesia). Password 8–72 karakter; email di-trim + lowercase.
- Role: konstanta di `shared/constants/roles.js`, juga diekspor ulang oleh `@/modules/auth`.

## Alur token

- Access token di memori (auth store), refresh token di localStorage via `shared/utils/storage.js`.
- Guard memanggil `auth.loadSession()` sebelum navigasi pertama; `main.js` mount setelah `router.isReady()` (loader di `index.html`).
- Login/refresh backend hanya mengembalikan token → store memanggil `GET /auth/me` setelahnya.
- `http.js`: 401 → satu refresh bersama untuk semua request yang gagal, lalu diulang; refresh gagal → `onUnauthorized` sekali (bersihkan sesi, ke `/login?redirect=`). `/auth/login` dan `/auth/refresh` memakai `{ skipAuth: true, skipAuthRefresh: true }`.

## Catatan

- Error backend dinormalisasi jadi `ApiError { status, message, fieldErrors }`. Validasi backend = **400** (bukan 422); email duplikat = 409; password lama salah = 400 tanpa field.
- Chart.js: `chart.js/auto` di-alias ke `src/shared/utils/chart.js`; daftarkan controller baru di sana.
- HTML kaya selalu dirender lewat `RichTextViewer` (DOMPurify + KaTeX). Jangan `v-html` konten pengguna di tempat lain.
- Modul `playground` hanya aktif saat `import.meta.env.DEV`.
- Keputusan yang tidak dijelaskan issue: catat di README.md bagian "Keputusan teknis".
