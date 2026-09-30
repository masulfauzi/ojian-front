// Registri Chart.js. Komponen Chart PrimeVue memuat `chart.js/auto`; vite.config.js mengarahkan
// import itu ke file ini sehingga hanya bagian Chart.js di bawah yang ikut ke bundle.
// Tambahkan controller/elemen di sini bila butuh jenis grafik lain (pie, doughnut, radar, ...).
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Title,
  Tooltip,
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Title,
  Tooltip,
)

export default Chart
