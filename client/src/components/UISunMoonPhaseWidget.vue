<template>
  <UIWidgetView :title="city">
    <template #header-suffix>
      <div class="sunmoon-header-actions">
        <span class="sm-time">{{ formattedTime }}</span>
        <button class="sm-search-btn" @click="toggleSearch(!isSearchActive)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
      </div>
    </template>

    <div class="sunmoon-body">
      <div class="sm-search-bar" v-if="isSearchActive">
        <input 
          ref="searchInput"
          v-model="searchQuery" 
          @keydown.enter="handleSearch" 
          placeholder="Search City..." 
          class="sm-input"
        />
      </div>

      <div class="sunmoon-data-grid" :class="{ opacity: loading }">
        <div class="sm-card">
          <div class="sm-label">Sun</div>
          <div class="sm-viz-container">
            <svg viewBox="0 0 200 100" style="width: 100%; height: 100%;">
              <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="var(--ui-border)" stroke-width="3" stroke-dasharray="5,5" />
              <path :d="sunProgressPath" fill="none" stroke="#FCE570" stroke-width="4" stroke-linecap="round" />
              <circle :cx="sunDotX" :cy="sunDotY" r="8" :fill="sunDotFill" stroke="#FCE570" stroke-width="2" />
              <line x1="10" y1="90" x2="190" y2="90" stroke="var(--ui-border)" stroke-width="1" />
            </svg>
          </div>
          <div class="sm-times">
            <span>{{ formattedSunrise }}</span>
            <span>{{ formattedSunset }}</span>
          </div>
          <div class="sm-subtext">Daylight: {{ daylightDuration }}</div>
        </div>

        <div class="sm-card">
          <div class="sm-label">Moon</div>
          <div class="sm-viz-container moon-container">
            <MoonPhase width="60px" :latitude="lat" :illumination="moonIllumination" :phase="moonPhaseName" />
          </div>
          <div class="sm-moon-info">
            <div class="sm-phase">{{ moonPhaseName }}</div>
            <div class="sm-subtext">{{ moonIllumination }}%</div>
          </div>
        </div>
      </div>
    </div>
  </UIWidgetView>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import SunCalc from 'suncalc'

const props = defineProps({ location: { type: String, default: 'London' } })

// State
const city = ref(props.location)
const lat = ref(51.5074)
const lon = ref(-0.1278)
const timezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone)
const date = ref(new Date())
const isSearchActive = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const searchInput = ref(null)
let timer = null

// --- Computeds ---
const sunTimes = computed(() => SunCalc.getTimes(date.value, lat.value, lon.value))
const formatTime = (d) => {
  if (!d || isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone.value })
}
const formattedTime = computed(() => formatTime(date.value))
const formattedSunrise = computed(() => sunTimes.value ? formatTime(sunTimes.value.sunrise) : '--:--')
const formattedSunset = computed(() => sunTimes.value ? formatTime(sunTimes.value.sunset) : '--:--')

const daylightDuration = computed(() => {
  if (!sunTimes.value) return '--'
  const diff = sunTimes.value.sunset - sunTimes.value.sunrise
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
})

const sunPosition = computed(() => {
  if (!sunTimes.value) return { x: 20, y: 90 }
  const nowMs = date.value.getTime()
  const startMs = sunTimes.value.sunrise.getTime()
  const endMs = sunTimes.value.sunset.getTime()
  let percent = (nowMs - startMs) / (endMs - startMs)
  if (percent < 0) percent = 0; if (percent > 1) percent = 1
  const angle = Math.PI - percent * Math.PI
  return {
    x: 100 + 80 * Math.cos(angle),
    y: 90 - 80 * Math.sin(angle)
  }
})

const sunDotX = computed(() => sunPosition.value.x)
const sunDotY = computed(() => sunPosition.value.y)
const sunProgressPath = computed(() => `M 20 90 A 80 80 0 0 1 ${sunDotX.value} ${sunDotY.value}`)
const sunDotFill = computed(() => {
  const now = date.value.getTime()
  const start = sunTimes.value?.sunrise.getTime() || 0
  const end = sunTimes.value?.sunset.getTime() || 0
  return now < start || now > end ? 'gray' : '#FCE570'
})

// Lunar
const moonData = computed(() => SunCalc.getMoonIllumination(date.value))
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
const moonIllumination = computed(() => moonData.value ? Math.round(moonData.value.fraction * 100) : 0)

// Methods
const toggleSearch = (val) => {
  isSearchActive.value = val
  if(val) nextTick(() => searchInput.value?.focus())
}
const handleSearch = async () => {
  if (!searchQuery.value) return
  loading.value = true
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.value)}&format=json&limit=1`)
    const data = await res.json()
    if (data?.[0]) {
      lat.value = parseFloat(data[0].lat); lon.value = parseFloat(data[0].lon)
      city.value = data[0].name.split(',')[0]
      toggleSearch(false)
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(() => { timer = setInterval(() => date.value = new Date(), 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.sunmoon-header-actions { display: flex; align-items: center; gap: 8px; }
.sm-time { font-size: 13px; font-weight: 600; color: var(--text-color); }
.sm-search-btn { background: transparent; border: none; color: var(--ui-text-secondary); cursor: pointer; }
.sunmoon-body { display: flex; flex-direction: column; height: 100%; }
.sm-search-bar { margin-bottom: 12px; }
.sm-input { width: 100%; background: var(--ui-bg-input); border: 1px solid var(--ui-border); padding: 6px; border-radius: 6px; color: var(--text-color); }
.sunmoon-data-grid { display: flex; gap: 12px; flex: 1; }
.sm-card { flex: 1; background: var(--ui-bg-element, #f2f2f7); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
.sm-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--ui-text-secondary); width: 100%; text-align: left; }
.sm-viz-container { width: 100%; height: 60px; margin-top: 10px; }
.moon-container { display: flex; justify-content: center; align-items: center; }
.sm-times { width: 100%; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; }
.sm-subtext { font-size: 10px; color: var(--ui-text-secondary); margin-top: 4px; }
.sm-moon-info { text-align: center; }
.sm-phase { font-size: 12px; font-weight: 600; margin-top: 4px; }
</style>
