# exam-web

Frontend aplikasi ujian online multi-sekolah. Vue 3 (JavaScript, `<script setup>`) + Vite, dengan arsitektur **modular per fitur** yang sejajar dengan backend [`exam-api`](../ojian-back) (Go + Fiber).

## Prasyarat

- Node.js LTS **20.19+** atau **22.12+**, npm.
- Backend `exam-api` berjalan (default `http://localhost:8080/api/v1`) dan admin sudah di-seed (`make seed` di repo backend).
  Backend mengizinkan origin `http://localhost:5173`, jadi dev server dijalankan di port 5173 (`strictPort`).

## Setup

```bash
npm install
cp .env.example .env      # sesuaikan VITE_API_BASE_URL bila perlu
npm run dev               # http://localhost:5173
```

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_APP_NAME` | `Exam Web` | Nama aplikasi (judul tab, sidebar, halaman login) |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Alamat dasar API |

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Preview hasil build |
| `npm run lint` / `npm run lint:fix` | ESLint (flat config + eslint-plugin-vue + aturan batas modul) |
| `npm run format` | Prettier untuk `src/` |
| `npm run test` | Vitest (jsdom), sekali jalan. `npm run test:watch` untuk mode watch |

## Struktur folder

```
src/
├── main.js            bootstrap: pinia, PrimeVue, wiring auth↔http, router, mount setelah router siap
├── App.vue            <RouterView /> + Toast + ConfirmDialog
├── app/               perakitan aplikasi (boleh mengenal semua modul)
│   ├── router/        index.js (kumpulkan routes.js semua modul), guards.js (auth, role, judul)
│   ├── plugins/       primevue.js (tema Aura, locale Indonesia, Toast/Confirm service)
│   ├── layouts/       AuthLayout, DashboardLayout (+ SidebarNav)
│   ├── menu.js        kumpulkan menu.js semua modul, filter berdasarkan role
│   └── bootstrap.js   isi setAuthHandlers() http client dengan fungsi dari auth store
├── shared/            generik, TIDAK boleh mengimpor modules/ atau app/
│   ├── api/           http.js (axios + interceptor + refresh token), errors.js (ApiError)
│   ├── components/    form/*, RichTextEditor, RichTextViewer, SortableList, BaseChart, PageHeader, EmptyState
│   ├── composables/   useNotify, useConfirm, useDebounce, useServerErrors
│   ├── schemas/       common.js (aturan Zod + error map Indonesia)
│   ├── constants/     roles.js
│   └── utils/         storage, format, math (KaTeX), sanitize (DOMPurify), chart (registri Chart.js)
├── modules/
│   ├── auth/          login, sesi, refresh token, profil + ganti password
│   ├── user/          manajemen user (khusus admin)
│   ├── dashboard/     halaman sambutan
│   ├── playground/    /dev/playground — hanya saat development
│   └── system/        403 dan 404
└── styles/main.css    gaya global (tanpa Tailwind)
```

Alur di dalam modul: **view → store / api → `shared/api/http`**. View tidak memanggil axios; hanya `api/*.api.js` yang memakai instance `http`.

## Cara menambah modul baru

1. Buat folder `src/modules/<nama>` berisi `index.js`, `routes.js`, `menu.js`, `api/`, `stores/`, `schemas/`, `components/`, `views/`.
   `index.js` adalah public API modul — modul lain hanya boleh mengimpor dari `@/modules/<nama>`.
2. Tulis fungsi API di `api/<nama>.api.js` memakai `http`, `unwrap`, `unwrapList` dari `@/shared/api/http`.
   Petakan field snake_case backend ↔ camelCase frontend di file ini saja (lihat `user.api.js`, termasuk `remapFieldErrors` untuk error validasi).
3. Buat store Pinia (`stores/<nama>.store.js`) dan view. Halaman di-lazy-load di `routes.js`:
   ```js
   export default [
     {
       path: '/sekolah',
       name: 'schools',
       component: () => import('./views/SchoolListPage.vue'),
       meta: { layout: 'dashboard', requiresAuth: true, roles: [ROLE_ADMIN], title: 'Sekolah' },
     },
   ]
   ```
4. Isi `meta` route (`layout`, `requiresAuth`, `roles`, `title`) dan item `menu.js`:
   ```js
   export default [{ label: 'Sekolah', icon: 'pi pi-building', to: { name: 'schools' }, roles: [ROLE_ADMIN], order: 10 }]
   ```
   **Tidak perlu mengubah router atau layout** — `app/router/index.js` dan `app/menu.js` mengumpulkannya lewat `import.meta.glob`. (Sudah diuji dengan modul dummy `sample`, lalu dihapus.)
5. Tulis test di `__tests__/` untuk schema dan store (mock modul `api/` dengan `vi.mock`).

## Kontrak API yang dipakai

Dicocokkan dengan kode dan Swagger backend (`ojian-back/docs/swagger.yaml`). Semua pemetaan ada di `modules/auth/api/auth.api.js` dan `modules/user/api/user.api.js`.

- Envelope: `{ success, message, data, meta? }`; list memakai `meta: { page, limit, total, total_pages }` → `{ page, limit, total, totalPages }`.
- Error: `{ success: false, message, errors?: [{ field, message }] }` → `ApiError { status, message, fieldErrors }`. Nama `field` dari backend = nama JSON (snake_case).
- `POST /auth/login` dan `POST /auth/refresh` mengembalikan **hanya token**: `{ access_token, access_token_expires_at, refresh_token, refresh_token_expires_at, token_type }` — **tanpa `user`**. Karena itu setelah login/refresh frontend memanggil `GET /auth/me`.
- `POST /auth/refresh` body `{ refresh_token }`. `POST /auth/change-password` body `{ old_password, new_password }`.
- User: `{ id, name, email, role, is_active, created_at, updated_at }`. `PUT /users/:id` wajib mengirim `name, email, role, is_active`.
- Status yang ditangani khusus:
  - error validasi backend berstatus **400** (bukan 422) dengan `errors[]` → dipetakan ke field form;
  - **409** "Email sudah digunakan" (tanpa detail field) → ditampilkan di field `email`;
  - **400** "Password lama salah" (tanpa detail field) → ditampilkan di field password lama;
  - **429** rate limit login (10/menit/IP) → pesan backend di form login.
- Backend belum punya endpoint logout; keluar = hapus sesi lokal.

## Alur token

- Access token hanya di memori (Pinia), refresh token di `localStorage` (`exam-web:refresh_token`, lewat `shared/utils/storage.js`).
- Saat aplikasi dimuat: guard memanggil `loadSession()` (refresh → `/auth/me`) sebelum navigasi pertama selesai, dan `main.js` baru me-mount aplikasi setelah `router.isReady()`. Selama itu `index.html` menampilkan loader, sehingga halaman login tidak sempat tampil sekilas.
- Interceptor 401: refresh **satu kali** per request; request 401 bersamaan berbagi satu promise refresh lalu diulang. Bila refresh gagal, `onUnauthorized` dipanggil sekali → sesi dibersihkan dan diarahkan ke `/login?redirect=<tujuan>`.
- `/auth/login` dan `/auth/refresh` memakai opsi `skipAuth` + `skipAuthRefresh` sehingga tidak memicu siklus refresh.

## Keputusan teknis

| Topik | Keputusan |
|---|---|
| Versi | `npm install` terbaru memasang PrimeVue 5 / Vue Router 5 / Pinia 4; di-pin ke **PrimeVue 4.5**, **@primeuix/themes 2** (pasangan PrimeVue 4.5), **primeicons 7**, **Vue Router 4.6**, **Pinia 3** sesuai issue. |
| Zod | `@vee-validate/zod@4.15` hanya mendukung Zod 3 (`peerDependencies: zod ^3.24`), jadi Zod di-pin ke **3.25.x**. Error map Indonesia dipasang global di `shared/schemas/common.js`. |
| Rumus TipTap | Memakai ekstensi resmi **`@tiptap/extension-mathematics`** (kompatibel dengan TipTap 3.31 dan KaTeX 0.18). `InlineMath` dan `BlockMath` dikonfigurasi langsung agar rumus blok memakai `displayMode` seperti di viewer. HTML: `<span data-type="inline-math" data-latex="…">` dan `<div data-type="block-math" data-latex="…">`. |
| Impor PrimeVue | **Impor eksplisit** di tiap komponen (`import Button from 'primevue/button'`), tanpa plugin auto-import — lebih sederhana, tanpa dependensi tambahan, dan jelas saat dibaca. |
| Chart.js | Komponen Chart PrimeVue memuat `chart.js/auto` (semua controller). `vite.config.js` meng-alias import itu ke `shared/utils/chart.js` yang hanya mendaftarkan bar, line, skala kategori/linear, legend, tooltip, title, filler. Tambahkan controller lain di file itu bila perlu. |
| Sanitasi | `shared/utils/sanitize.js`: DOMPurify tahap 1 (profil HTML, izinkan `data-type`/`data-latex`, buang `style`, form, iframe), render KaTeX (`trust: false`), lalu DOMPurify tahap 2 (HTML+SVG+MathML) sebelum `v-html`. |
| Layout | `meta.layout` `'auth'` / `'dashboard'` menjadi children dari route layout. Ditambah `'blank'` (tanpa layout) untuk 403, 404, dan playground. |
| Playground | `routes.js` dan `menu.js` modul playground bernilai array kosong bila `!import.meta.env.DEV`, sehingga halaman dan dependensinya (TipTap, KaTeX, Chart.js) tidak ikut build produksi. Playground tidak butuh login agar bisa dicoba tanpa backend. |
| Komponen form | Komponen form fitur menerima prop `submit` (fungsi async) alih-alih event, agar form bisa menunggu hasilnya (`isSubmitting`) dan memetakan error server ke field. Komponen tetap tidak memanggil store/API. |
| Filter user | `page`, `search`, `role` disimpan di query URL (sumber kebenaran); `limit` tetap 10. |
| Tambahan kecil | `FormField.vue` (kerangka label/error) dan `FormSwitch.vue` (status aktif) di `shared/components/form`; `SidebarNav.vue` di `app/layouts`. |
