<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'

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
const currentLocation = ref({ lat: null, lon: null, name: '' })

// Weather Data
const weatherData = ref({
  current: {
    temp: '--',
    condition: 'Loading...',
    code: 0,
    wind: '--',
    humid: '--',
    feels: '--',
    sunrise: '--',
    sunset: '--',
  },
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

const formatTime = (isoString) => {
  if (!isoString) return '--'
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// --- API Logic ---
const fetchWeather = async (lat, lon, name, silent = false) => {
  currentLocation.value = { lat, lon, name }
  if (!silent) loading.value = true
  try {
    const res = await fetch(
      `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`,
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
        sunrise: formatTime(data.daily.sunrise[0]),
        sunset: formatTime(data.daily.sunset[0]),
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

const refreshData = async (silent = false) => {
  if (currentLocation.value.lat && currentLocation.value.lon) {
    await fetchWeather(
      currentLocation.value.lat,
      currentLocation.value.lon,
      currentLocation.value.name,
      silent,
    )
  }
}

const startAutoRefresh = () => {
  if (refreshTimer.value) clearInterval(refreshTimer.value)
  refreshTimer.value = setInterval(() => {
    refreshData(true)
  }, 3600000)
}

// --- Expansion Logic ---
const openWidget = async () => {
  if (isExpanded.value) return
  refreshData()
  isAnimating.value = true
  isExpanded.value = true
  document.body.style.overflow = 'hidden'
  emit('update:expanded', true)

  const rect = compactRef.value.$el.getBoundingClientRect()
  modalStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: 'none',
  }

  await nextTick()
  refreshIcons()
  void document.body.offsetHeight

  modalStyle.value = {
    top: '50%',
    left: '50%',
    width: 'var(--weather-w-expand, 360px)',
    // MODIFIED: Reduced height from 600px to 500px
    height: 'var(--weather-h-expand, 500px)',
    transform: 'translate(-50%, -50%)',
  }
}

const closeWidget = async () => {
  refreshData(true)
  const rect = compactRef.value.$el.getBoundingClientRect()
  modalStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
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
    <UIWidgetView
      width="170px"
      ref="compactRef"
      :title="weatherData.locationName"
      class="compact-widget-view"
      :class="{ 'opacity-0': isExpanded }"
      @click="openWidget"
    >
      <template #header-suffix>
        <i :data-lucide="weatherData.current.icon || 'cloud'" class="icon-header"></i>
      </template>

      <div class="compact-body">
        <div class="compact-info">
          <span class="compact-temp">{{ weatherData.current.temp }}°</span>
          <span class="compact-condition">{{ weatherData.current.condition }}</span>
        </div>
        <i :data-lucide="weatherData.current.icon || 'cloud'" class="compact-icon-lg"></i>
      </div>
    </UIWidgetView>

    <Teleport to="body">
      <div v-if="isAnimating" class="weather-teleport-container">
        <div class="overlay" :class="{ active: isExpanded }" @click="closeWidget"></div>
        <div class="expanded-modal surface" :style="modalStyle">
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
                <button class="close-btn" @click.stop="closeWidget">
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
                  <span class="stat-label">Wind</span>
                  <span class="stat-val">{{ weatherData.current.wind }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Sunrise</span>
                  <span class="stat-val">{{ weatherData.current.sunrise }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Sunset</span>
                  <span class="stat-val">{{ weatherData.current.sunset }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Humidity</span>
                  <span class="stat-val">{{ weatherData.current.humid }}%</span>
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
  display: inline-block;
  width: 100%;
  height: 100%;
}

/* Compact View overrides */
.compact-widget-view {
  cursor: pointer;
  transition: opacity 0.1s;
  height: 100%;
}
.opacity-0 {
  opacity: 0;
  pointer-events: none;
}
.compact-body {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding-right: 8px;
}
.compact-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.compact-icon-lg {
  width: 40px;
  height: 40px;
  color: var(--text-color);
  opacity: 0.9;
  flex-shrink: 0;
}
.compact-temp {
  font-size: 42px;
  font-weight: 300;
  line-height: 1;
  color: var(--text-color);
  font-family: var(--font-family);
}
.compact-condition {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 4px;
  font-family: var(--font-family);
}
.icon-header {
  width: 20px;
  height: 20px;
  color: var(--text-color);
}

/* Expanded Modal */
.weather-teleport-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}
.overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  backdrop-filter: blur(var(--overlay-blur));
}
.overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.expanded-modal {
  position: fixed;
  z-index: 9999;
  cursor: default;
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  border-radius: var(--surface-radius);
  box-shadow: var(--dropdown-shadow);

  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.view-expanded {
  padding: 20px; /* Reduced from 24px */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  color: var(--text-color);
  font-family: var(--font-family);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px; /* Reduced from 10px */
  flex-shrink: 0;
}
.city-name-lg {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}
.condition-lg {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.close-btn,
.icon-btn {
  background: var(--btn-bg);
  border: var(--btn-border);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--btn-text);
  transition: filter 0.2s;
}
.close-btn:hover,
.icon-btn:hover {
  filter: brightness(1.1);
}

.controls-row {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}
.main-weather-lg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 110px; /* Reduced from 150px */
}
.temp-lg {
  font-size: 64px; /* Reduced from 72px */
  font-weight: 200;
  line-height: 1;
  color: var(--text-color);
}
.hl-lg {
  font-size: 15px;
  margin-top: 5px;
  font-weight: 500;
  color: var(--text-secondary);
}
.stats-row {
  display: flex;
  justify-content: space-around;
  background: rgba(var(--surface-rgb), 0.05);
  border: var(--surface-border);
  border-radius: var(--widget-radius);
  padding: 10px; /* Reduced from 12px */
  margin-bottom: 15px; /* Reduced from 20px */
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
  color: var(--text-tertiary);
}
.stat-val {
  font-size: 13px; /* Slightly reduced */
  font-weight: 600;
  color: var(--text-color);
}
.forecast-container {
  border-top: 1px solid rgba(var(--surface-rgb), 0.1);
  padding-top: 15px;
  flex-shrink: 0;
  padding-bottom: 5px;
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
  color: var(--text-secondary);
}
.f-temp {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}
.search-overlay {
  position: absolute;
  top: 70px;
  left: 20px;
  right: 20px;
  background: var(--dropdown-bg);
  border: var(--surface-border);
  padding: 10px;
  border-radius: var(--dropdown-radius);
  display: flex;
  gap: 5px;
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  z-index: 60;
  box-shadow: var(--dropdown-shadow);
}
.search-overlay.active {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}
.search-input {
  flex: 1;
  border-radius: var(--btn-radius);
  border: var(--surface-border);
  padding: 8px;
  font-size: 14px;
  outline: none;
  background: rgba(var(--surface-rgb), 0.1);
  color: var(--text-color);
  font-family: var(--font-family);
}
.search-input:focus {
  border-color: var(--sys-primary);
  background: rgba(var(--surface-rgb), 0.2);
}
.search-go {
  background: var(--sys-primary);
  color: #fff;
  border: none;
  padding: 0 12px;
  border-radius: var(--btn-radius);
  cursor: pointer;
  font-family: var(--font-family);
}
.icon-lg {
  width: 64px; /* Reduced from 80px */
  height: 64px;
  color: var(--text-color);
}
.icon-sm {
  width: 20px;
  height: 20px;
}
.icon-xs {
  width: 14px;
  height: 14px;
}
</style>
