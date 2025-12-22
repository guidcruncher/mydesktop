<script setup>
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'

// --- Props & Emits ---
const props = defineProps({
  location: { type: String, default: 'London' },
  expanded: { type: Boolean, default: false },
})

const emit = defineEmits(['update:expanded'])

// --- State ---
const isExpanded = ref(props.expanded)
const isAnimating = ref(false)
const loading = ref(true)
const searchOpen = ref(false)
const searchQuery = ref('')
const refreshTimer = ref(null)

// Store current location for auto-refresh
const currentLocation = ref({ lat: null, lon: null, name: '' })

// Weather Data
const weatherData = ref({
  current: { temp: '--', condition: 'Loading...', code: 0, wind: '--', humid: '--', feels: '--' },
  daily: [],
  locationName: props.location,
})

// DOM Refs
const compactRef = ref(null)
const modalStyle = ref({})

// API Constants
const API_URL = 'https://api.open-meteo.com/v1/forecast'
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// --- Icons ---
const loadIcons = () => {
  if (!window.lucide) {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/lucide@latest'
    script.onload = () => window.lucide?.createIcons()
    document.head.appendChild(script)
  } else {
    window.lucide.createIcons()
  }
}

const refreshIcons = () => {
  nextTick(() => window.lucide?.createIcons())
}

const getIcon = (code) => {
  const map = {
    0: { icon: 'sun', desc: 'Sunny' },
    1: { icon: 'sun', desc: 'Clear' },
    2: { icon: 'cloud-sun', desc: 'Partly Cloudy' },
    3: { icon: 'cloud', desc: 'Overcast' },
    45: { icon: 'align-justify', desc: 'Fog' },
    51: { icon: 'cloud-drizzle', desc: 'Drizzle' },
    61: { icon: 'cloud-rain', desc: 'Rain' },
    65: { icon: 'cloud-lightning', desc: 'Heavy Rain' },
    71: { icon: 'snowflake', desc: 'Snow' },
    95: { icon: 'zap', desc: 'Thunderstorm' },
  }
  return map[code] || { icon: 'cloud', desc: 'Unknown' }
}

// --- API Logic ---
const fetchWeather = async (lat, lon, name, silent = false) => {
  // Store for auto-refresh
  currentLocation.value = { lat, lon, name }

  if (!silent) loading.value = true

  try {
    const res = await fetch(
      `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
    )
    const data = await res.json()

    const cur = data.current
    const info = getIcon(cur.weather_code)

    const daily = []
    for (let i = 1; i <= 3; i++) {
      if (data.daily.time[i]) {
        const d = new Date(data.daily.time[i])
        daily.push({
          day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
          max: Math.round(data.daily.temperature_2m_max[i]),
          icon: getIcon(data.daily.weather_code[i]).icon,
        })
      }
    }

    weatherData.value = {
      locationName: name,
      current: {
        temp: Math.round(cur.temperature_2m),
        condition: info.desc,
        code: cur.weather_code,
        icon: info.icon,
        wind: cur.wind_speed_10m,
        humid: cur.relative_humidity_2m,
        feels: Math.round(cur.apparent_temperature),
        high: Math.round(data.daily.temperature_2m_max[0]),
        low: Math.round(data.daily.temperature_2m_min[0]),
      },
      daily,
    }
  } catch (err) {
    console.error(err)
  } finally {
    if (!silent) loading.value = false
    refreshIcons()
  }
}

const searchCity = async () => {
  if (!searchQuery.value) return
  try {
    const res = await fetch(`${GEO_URL}?name=${searchQuery.value}&count=1&language=en&format=json`)
    const data = await res.json()
    if (data.results?.[0]) {
      const { latitude, longitude, name } = data.results[0]
      fetchWeather(latitude, longitude, name)
      searchOpen.value = false
      searchQuery.value = ''
    } else {
      alert('City not found')
    }
  } catch (e) {
    console.error(e)
  }
}

const handleLocate = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((p) => {
      fetchWeather(p.coords.latitude, p.coords.longitude, 'My Location')
    })
  }
}

// --- Helper: Refresh Data ---
const refreshData = async (silent = false) => {
  // Only refresh if we have a valid location loaded
  if (currentLocation.value.lat && currentLocation.value.lon) {
    await fetchWeather(
      currentLocation.value.lat,
      currentLocation.value.lon,
      currentLocation.value.name,
      silent,
    )
  }
}

// --- Auto Refresh Logic ---
const startAutoRefresh = () => {
  if (refreshTimer.value) clearInterval(refreshTimer.value)
  // Refresh every 1 hour (3600000 ms)
  refreshTimer.value = setInterval(() => {
    refreshData(true) // Silent refresh
  }, 3600000)
}

// --- Expansion / Animation Logic ---

const openWidget = async () => {
  if (isExpanded.value) return

  // Force data refresh on expand
  refreshData()

  isAnimating.value = true
  isExpanded.value = true
  document.body.style.overflow = 'hidden'
  emit('update:expanded', true)

  const rect = compactRef.value.getBoundingClientRect()
  modalStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: '22px',
    transform: 'none',
  }

  await nextTick()
  refreshIcons()

  void document.body.offsetHeight

  modalStyle.value = {
    top: '50%',
    left: '50%',
    width: 'var(--weather-w-expand)',
    height: 'var(--weather-h-expand)',
    borderRadius: '34px',
    transform: 'translate(-50%, -50%)',
  }
}

const closeWidget = async () => {
  // Force silent data refresh on collapse to update compact view
  refreshData(true)

  const rect = compactRef.value.getBoundingClientRect()
  modalStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: '22px',
    transform: 'none',
  }

  searchOpen.value = false

  setTimeout(() => {
    isExpanded.value = false
    isAnimating.value = false
    document.body.style.overflow = ''
    emit('update:expanded', false)
  }, 600)
}

// Watchers
// Location watcher handles the "Refresh on location change" requirement via searchCity->fetchWeather
watch(
  () => props.location,
  (newVal) => {
    searchQuery.value = newVal
    searchCity()
  },
  { immediate: true },
)
watch(
  () => props.expanded,
  (newVal) => {
    if (newVal) openWidget()
    else closeWidget()
  },
)
watch(weatherData, refreshIcons)

// Lifecycle
onMounted(() => {
  loadIcons()
  if (props.expanded) openWidget()
  startAutoRefresh()
})

onUnmounted(() => {
  document.body.style.overflow = ''
  if (refreshTimer.value) clearInterval(refreshTimer.value)
})
</script>

<template>
  <div class="weather-wrapper">
    <div
      ref="compactRef"
      class="ios-widget compact-widget"
      :class="{ 'opacity-0': isExpanded }"
      @click="openWidget"
    >
      <div class="view-compact">
        <div class="compact-header">
          <span>{{ weatherData.locationName }}</span>
          <div class="compact-icon-wrapper">
            <i :data-lucide="weatherData.current.icon" class="icon-white"></i>
          </div>
        </div>
        <div class="compact-body">
          <span class="compact-temp">{{ weatherData.current.temp }}°</span>
          <span class="compact-condition">{{ weatherData.current.condition }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isAnimating" class="weather-teleport-container">
        <div class="backdrop" :class="{ active: isExpanded }" @click="closeWidget"></div>

        <div class="ios-widget expanded-modal" :style="modalStyle">
          <div class="view-expanded">
            <div class="search-overlay" :class="{ active: searchOpen }">
              <input
                v-model="searchQuery"
                @keyup.enter="searchCity"
                type="text"
                placeholder="Search City..."
                class="search-input"
              />
              <button @click="searchCity" class="search-go">Go</button>
            </div>

            <div class="widget-header">
              <div>
                <h2 class="city-name-lg">{{ weatherData.locationName }}</h2>
                <p class="condition-lg">{{ weatherData.current.condition }}</p>
              </div>
              <div class="header-actions">
                <button class="close-btn" @click.stop="closeWidget" title="Close">
                  <i data-lucide="x" class="icon-sm"></i>
                </button>
                <div class="controls-row">
                  <button class="icon-btn" @click.stop="searchOpen = !searchOpen">
                    <i data-lucide="search" class="icon-xs"></i>
                  </button>
                  <button class="icon-btn" @click.stop="handleLocate">
                    <i data-lucide="navigation" class="icon-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="expanded-content">
              <div class="main-weather-lg">
                <div class="main-icon-container">
                  <i :data-lucide="weatherData.current.icon" class="icon-lg"></i>
                </div>
                <div class="temp-lg">{{ weatherData.current.temp }}°</div>
                <div class="hl-lg">
                  H:{{ weatherData.current.high }}° L:{{ weatherData.current.low }}°
                </div>
              </div>

              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-label">Wind</span
                  ><span class="stat-val">{{ weatherData.current.wind }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Humidity</span
                  ><span class="stat-val">{{ weatherData.current.humid }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Feels</span
                  ><span class="stat-val">{{ weatherData.current.feels }}°</span>
                </div>
              </div>

              <div class="forecast-container">
                <div class="stat-label mb-2">3-Day Forecast</div>
                <div class="forecast-grid">
                  <div v-for="(day, idx) in weatherData.daily" :key="idx" class="forecast-day">
                    <div class="f-day">{{ day.day }}</div>
                    <i :data-lucide="day.icon" class="icon-sm"></i>
                    <div class="f-temp">{{ day.max }}°</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.weather-wrapper {
  color: var(--weather-text-primary);
  font-family: var(--font-family);
  display: inline-block; /* Wraps compact widget size */
}

/* Ensure font/color variables pass to Teleport container */
.weather-teleport-container {
  color: var(--weather-text-primary);
  font-family: var(--font-family);
  position: absolute; /* Non-intrusive container */
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}

/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--weather-backdrop-color);
  backdrop-filter: blur(var(--weather-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--weather-backdrop-blur));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
  z-index: 9998;
}
.backdrop.active {
  opacity: 1;
  pointer-events: all;
}

/* Base Widget Style (Shared) */
.ios-widget {
  background: linear-gradient(180deg, var(--weather-bg-start), var(--weather-bg-end));
  box-shadow: var(--weather-shadow);
  overflow: hidden;
  user-select: none;
  /* Smooth animation for FLIP properties */
  transition:
    width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-radius 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Compact specific */
.compact-widget {
  width: var(--weather-w-compact);
  height: var(--weather-h-compact);
  border-radius: 22px;
  cursor: pointer;
  position: relative;
}
/* Hide compact when expanded (creates illusion it moved) */
.opacity-0 {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;
}

/* Expanded Modal specific */
.expanded-modal {
  position: fixed;
  z-index: 9999;
  cursor: default;
  display: flex;
  flex-direction: column;
}

/* Views */
.view-compact {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.view-expanded {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0; /* Fade in content after expansion starts */
  animation: fadeIn 0.4s ease 0.2s forwards;
  overflow-y: auto;
  scrollbar-width: none;
}
.view-expanded::-webkit-scrollbar {
  display: none;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Internal Styling (Same as before) */
.compact-header {
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.compact-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.compact-temp {
  font-size: 42px;
  font-weight: 300;
  line-height: 1;
}
.compact-condition {
  font-size: 13px;
  color: var(--weather-text-secondary);
  font-weight: 500;
}
.compact-icon-wrapper {
  position: absolute;
  top: 15px;
  right: 15px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.city-name-lg {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}
.condition-lg {
  font-size: 15px;
  color: var(--weather-text-secondary);
  margin: 0;
}
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.expanded-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.close-btn {
  background: var(--weather-close-btn-bg);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--weather-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.4);
}

.controls-row {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}
.icon-btn {
  background: var(--weather-btn-bg);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--weather-text-primary);
}

.main-weather-lg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}
.temp-lg {
  font-size: 72px;
  font-weight: 200;
  line-height: 1;
}
.hl-lg {
  font-size: 15px;
  margin-top: 5px;
  font-weight: 500;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  background: var(--weather-glass-bg);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--weather-text-secondary);
}
.stat-val {
  font-size: 14px;
  font-weight: 600;
}

.forecast-container {
  border-top: 1px solid var(--weather-glass-border);
  padding-top: 15px;
  flex-shrink: 0;
  padding-bottom: 10px;
}
.forecast-grid {
  display: flex;
  justify-content: space-between;
  text-align: center;
}
.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.f-day {
  font-size: 13px;
  font-weight: 600;
  color: var(--weather-text-secondary);
}
.f-temp {
  font-size: 14px;
  font-weight: 600;
}

.search-overlay {
  position: absolute;
  top: 60px;
  left: 20px;
  right: 20px;
  background: var(--weather-overlay-bg);
  padding: 10px;
  border-radius: 12px;
  display: flex;
  gap: 5px;
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  z-index: 60;
}
.search-overlay.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}
.search-input {
  flex: 1;
  border-radius: 8px;
  border: none;
  padding: 8px;
  font-size: 14px;
  outline: none;
}
.search-go {
  background: var(--weather-accent);
  color: white;
  border: none;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
}

/* Utils */
.icon-white {
  color: var(--weather-text-primary);
  width: 32px;
  height: 32px;
}
.icon-lg {
  color: var(--weather-text-primary);
  width: 80px;
  height: 80px;
  stroke-width: 1.5;
}
.icon-sm {
  color: var(--weather-text-primary);
  width: 20px;
  height: 20px;
}
.icon-xs {
  color: var(--weather-text-primary);
  width: 14px;
  height: 14px;
}
.mb-2 {
  margin-bottom: 10px;
}
</style>
