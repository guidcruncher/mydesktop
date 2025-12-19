<template>
  <div class="sunmoon-widget-container" :class="{ 'sunmoon-loading-shim': loading }">
    <div class="sunmoon-search-overlay" :class="{ 'sunmoon-active': isSearchActive }">
      <input
        ref="searchInput"
        type="text"
        class="sunmoon-search-input"
        placeholder="Search city..."
        v-model="searchQuery"
        @keydown.enter="handleSearch"
      />
      <button class="sunmoon-close-search" @click="toggleSearch(false)">Cancel</button>
    </div>

    <div class="sunmoon-header">
      <div class="sunmoon-location-group" @click="toggleSearch(true)">
        <div class="sunmoon-location-title">
          {{ city }}
          <svg class="sunmoon-location-icon" viewBox="0 0 24 24">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
        </div>
        <div class="sunmoon-time-display">{{ formattedTime }}</div>
        <div class="sunmoon-date-subtitle">{{ formattedDate }}</div>
      </div>
    </div>

    <div class="sunmoon-data-section">
      <div class="sunmoon-card">
        <div class="sunmoon-label">Sun Position</div>
        <div class="sunmoon-sun-viz">
          <svg viewBox="0 0 200 100" style="width: 100%; height: 100%; overflow: visible">
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="var(--ui-text-secondary)"
              stroke-width="3"
              stroke-dasharray="5,5"
              stroke-linecap="round"
            />
            <path
              :d="sunProgressPath"
              fill="none"
              stroke="#FCE570"
              stroke-width="4"
              stroke-linecap="round"
            />
            <circle
              :cx="sunDotX"
              :cy="sunDotY"
              r="8"
              :fill="sunDotFill"
              stroke="#FCE570"
              stroke-width="2"
            />
            <line
              x1="10"
              y1="90"
              x2="190"
              y2="90"
              stroke="var(--sunmoon-border-widget)"
              stroke-width="1"
            />
          </svg>
        </div>
        <div class="sunmoon-sun-info">
          <span>{{ formattedSunrise }}</span>
          <span>{{ formattedSunset }}</span>
        </div>
        <div style="font-size: 12px; margin-top: 5px; color: var(--ui-text-secondary)">
          Daylight: <span style="color: var(--ui-text-primary)">{{ daylightDuration }}</span>
        </div>
      </div>

      <div class="sunmoon-card" style="flex-direction: column; justify-content: center">
        <div class="sunmoon-label" style="position: absolute; top: 16px; left: 16px">
          Moon Phase
        </div>
        <div class="sunmoon-moon-viz">
          <MoonPhase
            width="80px"
            :latitude="lat"
            :illumination="moonIllumination"
            :phase="moonPhaseName"
          />
        </div>
        <div class="sunmoon-moon-info">
          <div class="sunmoon-moon-phase-name"><br />{{ moonPhaseName }}</div>
          <div class="sunmoon-moon-illumination">{{ moonIllumination }}% Illumination</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import SunCalc from 'suncalc'

const props = defineProps({
  location: {
    type: String,
    default: 'London',
  },
})

// --- State ---
const city = ref(props.location)
const lat = ref(51.5074) // London Default
const lon = ref(-0.1278)
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone)
const date = ref(new Date())
const isSearchActive = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const searchInput = ref(null)
let timer = null

// --- Computed Solar Data ---
const sunTimes = computed(() => {
  return SunCalc.getTimes(date.value, lat.value, lon.value)
})

// Formats
const formatTime = (d) => {
  if (!d || isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone.value })
}

const formattedTime = computed(() => formatTime(date.value))
const formattedDate = computed(() => {
  return date.value.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone.value,
  })
})

const formattedSunrise = computed(() =>
  sunTimes.value ? formatTime(sunTimes.value.sunrise) : '--:--',
)
const formattedSunset = computed(() =>
  sunTimes.value ? formatTime(sunTimes.value.sunset) : '--:--',
)

const daylightDuration = computed(() => {
  if (!sunTimes.value) return '--'
  const diff = sunTimes.value.sunset - sunTimes.value.sunrise
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h} hr ${m} min`
})

// Sun Arc Calculations
const sunPosition = computed(() => {
  if (!sunTimes.value) return { x: 20, y: 90, percent: 0 }

  const nowMs = date.value.getTime()
  const startMs = sunTimes.value.sunrise.getTime()
  const endMs = sunTimes.value.sunset.getTime()

  let percent = (nowMs - startMs) / (endMs - startMs)
  if (percent < 0) percent = 0
  if (percent > 1) percent = 1

  const angle = Math.PI - percent * Math.PI
  const r = 80
  const cx = 100
  const cy = 90

  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)

  return { x, y, percent }
})

const sunDotX = computed(() => sunPosition.value.x)
const sunDotY = computed(() => sunPosition.value.y)

const sunProgressPath = computed(() => {
  // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  return `M 20 90 A 80 80 0 0 1 ${sunDotX.value} ${sunDotY.value}`
})

const sunDotFill = computed(() => {
  const now = date.value.getTime()
  const start = sunTimes.value?.sunrise.getTime() || 0
  const end = sunTimes.value?.sunset.getTime() || 0
  return now < start || now > end ? 'gray' : 'var(--sunmoon-sun-fill)'
})

// --- Computed Lunar Data ---
const moonData = computed(() => {
  return SunCalc.getMoonIllumination(date.value)
})

const moonPhaseName = computed(() => {
  if (!moonData.value) return '--'
  const p = moonData.value.phase
  if (p < 0.03 || p > 0.97) return 'New Moon'
  if (p < 0.22) return 'Waxing Crescent'
  if (p < 0.28) return 'First Quarter'
  if (p < 0.47) return 'Waxing Gibbous'
  if (p < 0.53) return 'Full Moon'
  if (p < 0.72) return 'Waning Gibbous'
  if (p < 0.78) return 'Last Quarter'
  return 'Waning Crescent'
})

const moonIllumination = computed(() => {
  return moonData.value ? Math.round(moonData.value.fraction * 100) : 0
})

const moonPath = computed(() => {
  if (!moonData.value) return ''
  const phase = moonData.value.phase
  const mR = 45

  if (phase <= 0.5) {
    // Waxing
    if (phase < 0.02) return ''
    if (phase > 0.48) return 'M 50 5 A 45 45 0 0 1 50 95 A 45 45 0 0 1 50 5'

    const pNorm = (phase - 0.25) * 4
    const rx = Math.abs(pNorm * mR)
    const sweep = pNorm > 0 ? 1 : 0
    return `M 50 5 A 45 45 0 0 1 50 95 A ${rx} 45 0 0 ${sweep} 50 5`
  } else {
    // Waning
    if (phase > 0.98) return ''
    const pNorm = (1.0 - phase - 0.25) * 4
    const rx = Math.abs(pNorm * mR)
    const sweep = pNorm > 0 ? 0 : 1
    return `M 50 5 A 45 45 0 0 0 50 95 A ${rx} 45 0 0 ${sweep} 50 5`
  }
})

const toggleSearch = (active) => {
  isSearchActive.value = active
  if (active) {
    nextTick(() => {
      if (searchInput.value) searchInput.value.focus()
    })
  } else {
    searchQuery.value = ''
  }
}

const handleSearch = async () => {
  if (!searchQuery.value) return
  loading.value = true
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.value)}&format=json&limit=1`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data && data.length > 0) {
      lat.value = parseFloat(data[0].lat)
      lon.value = parseFloat(data[0].lon)
      city.value = data[0].name.split(',')[0]
      await fetchTimezone()
      toggleSearch(false)
    } else {
      alert('City not found')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchTimezone = async () => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.value}&longitude=${lon.value}&timezone=auto&daily=sunrise`
    const res = await fetch(url)
    const data = await res.json()
    if (data.timezone) timezone.value = data.timezone
  } catch (e) {
    console.error(e)
  }
}

const getLocation = () => {
  if (navigator.geolocation && props.location === 'London') {
    loading.value = true
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        lat.value = pos.coords.latitude
        lon.value = pos.coords.longitude
        // Reverse Geo
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.value}&lon=${lon.value}&zoom=10`
          const res = await fetch(url)
          const data = await res.json()
          city.value = data.address.city || data.address.town || 'My Location'
          await fetchTimezone()
        } catch (e) {}
        loading.value = false
      },
      () => {
        loading.value = false
      },
    )
  }
}

onMounted(() => {
  // Initialize
  getLocation()

  // Timer
  timer = setInterval(() => {
    date.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* * CSS VARIABLES - Scoped via specific selector 
 * The .sunmoon-widget-container class wraps the whole template
 */
.sunmoon-widget-container {
  /* Layout Properties */
  width: 360px;
  height: 380px;
  background: var(--sunmoon-bg-widget);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 22px;
  border: 1px solid var(--sunmoon-border-widget);
  box-shadow: var(--sunmoon-shadow-widget);
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  /* Use Shared Font Variable */
  font-family: var(--weather-font-family);
  color: var(--ui-text-primary);
  box-sizing: border-box;
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

.sunmoon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 2;
}

.sunmoon-location-group {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.sunmoon-location-title {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sunmoon-location-icon {
  width: 14px;
  height: 14px;
  fill: var(--ui-text-primary);
  opacity: 0.5;
}

.sunmoon-time-display {
  font-size: 32px;
  font-weight: 300;
  margin-top: 4px;
  color: var(--ui-text-primary);
  letter-spacing: -0.5px;
}

.sunmoon-date-subtitle {
  font-size: 13px;
  color: var(--ui-text-secondary);
  font-weight: 500;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sunmoon-theme-toggle {
  background: var(--sunmoon-input-bg);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-text-primary);
}

/* Search Overlay */
.sunmoon-search-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: var(--sunmoon-bg-widget);
  backdrop-filter: blur(25px);
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-bottom: 1px solid var(--sunmoon-border-widget);
}

.sunmoon-search-overlay.sunmoon-active {
  transform: translateY(0);
}

.sunmoon-search-input {
  width: 100%;
  background: var(--sunmoon-input-bg);
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 16px;
  color: var(--ui-text-primary);
  outline: none;
}

.sunmoon-close-search {
  margin-left: 10px;
  background: none;
  border: none;
  color: var(--sunmoon-accent-color);
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
}

/* Cards */
.sunmoon-data-section {
  display: flex;
  gap: 16px;
  flex: 1;
}

.sunmoon-card {
  flex: 1;
  background: var(--sunmoon-card-bg);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.sunmoon-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ui-text-secondary);
  letter-spacing: 0.5px;
  align-self: flex-start;
  margin-bottom: 4px;
}

/* Sun Viz */
.sunmoon-sun-viz {
  width: 100%;
  height: 100px;
  position: relative;
  margin-top: 10px;
}
.sunmoon-sun-info {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ui-text-secondary);
  font-weight: 600;
  margin-top: -10px;
}

/* Moon Viz */
.sunmoon-moon-viz {
  width: 70px;
  height: 70px;
  position: relative;
}
.sunmoon-moon-info {
  text-align: center;
  margin-top: 8px;
}
.sunmoon-moon-phase-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-primary);
}
.sunmoon-moon-illumination {
  font-size: 12px;
  color: var(--ui-text-secondary);
  margin-top: 2px;
}

.sunmoon-loading-shim {
  opacity: 0.5;
}
</style>
