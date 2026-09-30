import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installPrimeVue } from './app/plugins/primevue'
import { createAppRouter } from './app/router'
import { wireAuth } from './app/bootstrap'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
const router = createAppRouter()

app.use(pinia)
installPrimeVue(app)
wireAuth({ pinia, router })
app.use(router)

// Tunggu navigasi pertama (termasuk pemulihan sesi dari refresh token) sebelum mount,
// agar halaman login tidak sempat tampil sekilas. Selama itu index.html menampilkan loader.
router.isReady().finally(() => app.mount('#app'))
