<template>
  <div class="map-wrapper-outer">
    <div class="map-backdrop" :class="{ active: isExpanded }" @click="collapseWidget"></div>

    <UIWidgetView
      class="map-widget-fixed"
      :class="{ 'map-expanded': isExpanded }"
      width="360px"
      height="360px"
      @click="handleCompactClick"
    >
      <div class="map-body-content">
        <div v-if="!isExpanded" class="map-click-overlay" title="Click to expand"></div>

        <div id="map" ref="mapContainerRef"></div>

        <div class="map-controls-group" :class="{ visible: isExpanded }">
          <button class="map-control-btn" @click.stop="toggleLayer" title="Switch Layer">
            <svg
              v-if="currentLayerMode === 'satellite'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
            </svg>
          </button>

          <button
            class="map-control-btn exit-btn"
            @click.stop="collapseWidget"
            title="Exit Full Screen"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="map-info-footer">
          <div class="location-text">
            <strong :title="locationName">{{ locationName }}</strong>
            <span class="mode-label">{{ timeZone }}</span>
          </div>
          <div class="clock-section">
            <div class="clock-time">{{ formattedTime }}</div>
            <div class="clock-date">{{ formattedDate }}</div>
          </div>
        </div>
      </div>
    </UIWidgetView>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import terminator from '@joergdietrich/leaflet.terminator'

const props = defineProps({
  location: { type: String, default: 'London' },
})

const isExpanded = ref(false)
const currentLayerMode = ref('satellite')
const mapContainerRef = ref(null)

const activeLat = ref(20)
const activeLng = ref(0)
const locationName = ref('Initializing...')
const timeZone = ref('UTC')
const now = ref(new Date())

let map = null
let layers = {}
let terminatorLayer = null
let markerLayer = null
let clockInterval = null

const ZOOM_COMPACT = 2
const ZOOM_EXPANDED = 4
const ZOOM_CLICKED = 6

const formattedTime = computed(() => {
  try {
    return now.value.toLocaleTimeString('en-US', {
      timeZone: timeZone.value,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch (e) {
    return '--:--'
  }
})

const formattedDate = computed(() => {
  try {
    return now.value.toLocaleDateString('en-US', {
      timeZone: timeZone.value,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return '...'
  }
})

const initMap = async () => {
  if (!mapContainerRef.value) return

  map = L.map(mapContainerRef.value, {
    center: [activeLat.value, activeLng.value],
    zoom: ZOOM_COMPACT,
    zoomControl: false,
    attributionControl: false,
    worldCopyJump: true,
  })

  layers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 },
    ),
  }
  layers.satellite.addTo(map)

  terminatorLayer = terminator({
    color: '#000',
    opacity: 0,
    fillColor: '#000',
    fillOpacity: 0.5,
    resolution: 5,
  }).addTo(map)

  markerLayer = L.circleMarker([0, 0], {
    radius: 8,
    fillColor: '#3b82f6',
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
    interactive: false,
  }).addTo(map)

  map.on('click', (e) => {
    if (!isExpanded.value) return
    // Use 'pan' strategy to keep current zoom level
    updateLocation(e.latlng.lat, e.latlng.lng, null, 'pan')
  })

  await performCitySearch(props.location)
  setTimeout(() => map?.invalidateSize(), 200)
}

const performCitySearch = async (query) => {
  if (!query) return
  locationName.value = 'Searching...'
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    )
    const data = await res.json()
    if (data.length > 0) {
      updateLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), query, false)
    }
  } catch (e) {
    locationName.value = 'Locate Error'
  }
}

const updateLocation = async (lat, lng, nameOverride = null, zoomStrategy = 'auto') => {
  locationName.value = 'Locating...'
  activeLat.value = lat
  activeLng.value = lng
  markerLayer.setLatLng([lat, lng])

  // Handle various zoom behaviors
  if (zoomStrategy === 'pan') {
    // Keep current zoom, just center
    map.flyTo([lat, lng], map.getZoom())
  } else if (zoomStrategy === true || zoomStrategy === 'auto') {
    // Standard behavior (Expansion vs Compact)
    const targetZoom = isExpanded.value ? ZOOM_CLICKED : ZOOM_COMPACT
    if (isExpanded.value) map.flyTo([lat, lng], targetZoom)
    else map.setView([lat, lng], targetZoom)
  } else {
    // Explicit false, usually for init
    map.setView([lat, lng], ZOOM_COMPACT)
  }

  try {
    const [tzRes, geoRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`,
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      ),
    ])

    const tzData = await tzRes.json()
    const geoData = await geoRes.json()

    timeZone.value = tzData.timezone || 'UTC'

    if (nameOverride) {
      locationName.value = nameOverride
    } else {
      let readableName = 'Unknown'
      if (geoData && geoData.address) {
        const a = geoData.address
        const city = a.city || a.town || a.village
        const country = a.country
        if (city && country) readableName = `${city}, ${country}`
        else if (country) readableName = country
      } else if (timeZone.value !== 'UTC') {
        readableName = timeZone.value.split('/').pop().replace(/_/g, ' ')
      }
      locationName.value = readableName
    }
  } catch (err) {
    locationName.value = 'Connection Error'
  }
}

const handleCompactClick = () => {
  if (!isExpanded.value) expandWidget()
}

const expandWidget = () => {
  if (isExpanded.value) return
  isExpanded.value = true
  setTimeout(() => {
    map.invalidateSize()
    map.flyTo([activeLat.value, activeLng.value], ZOOM_EXPANDED, { duration: 1 })
  }, 550)
}

const collapseWidget = (e) => {
  e?.stopPropagation()
  isExpanded.value = false
  setTimeout(() => {
    map.invalidateSize()
    map.flyTo([activeLat.value, activeLng.value], ZOOM_COMPACT, { duration: 1 })
  }, 550)
}

const toggleLayer = () => {
  if (currentLayerMode.value === 'satellite') {
    map.removeLayer(layers.satellite)
    layers.standard.addTo(map)
    currentLayerMode.value = 'standard'
  } else {
    map.removeLayer(layers.standard)
    layers.satellite.addTo(map)
    currentLayerMode.value = 'satellite'
  }
  terminatorLayer.bringToFront()
  markerLayer.bringToFront()
}

watch(() => props.location, performCitySearch)

onMounted(() => {
  initMap()
  clockInterval = setInterval(() => {
    now.value = new Date()
    if (terminatorLayer && terminatorLayer.setTime) terminatorLayer.setTime(now.value)
  }, 1000)
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
  if (map) {
    map.off()
    map.remove()
  }
})
</script>

<style lang="scss" scoped>
.map-wrapper-outer {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.map-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 90;
  backdrop-filter: blur(var(--overlay-blur));
  &.active {
    opacity: 1;
    pointer-events: auto;
  }
}

.map-widget-fixed {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 100;
  position: relative;
  padding: 0 !important;
  display: block !important;
  overflow: hidden;

  &:not(.map-expanded):hover {
    transform: translateY(-2px);
    box-shadow: var(--dropdown-shadow);
    cursor: pointer;
  }

  &.map-expanded {
    position: fixed;
    inset: 0;
    width: 100vw !important;
    /* Use dvh for mobile address bar compatibility */
    height: 100dvh !important;
    border-radius: 0 !important;
    border: none;
    z-index: 9999;
    transform: none !important;
    margin: 0;
  }
}

.map-body-content {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
  background: #1e1e1e;
}

.map-click-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  cursor: pointer;
  background: transparent;
}

.map-controls-group {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top, 0px) + 20px);
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  &.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}

.map-control-btn {
  width: 44px;
  height: 44px;
  background: var(--surface-bg);
  color: var(--text-color);
  border: var(--surface-border);
  border-radius: var(--btn-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(var(--surface-blur));
  transition: all 0.2s;
  padding: 0;
  &:hover {
    background: var(--sys-primary);
    color: #fff;
  }
  &.exit-btn:hover {
    background: var(--sys-danger);
  }
  svg {
    width: 20px;
    height: 20px;
  }
}

.map-info-footer {
  position: absolute;
  /* Safe area inset ensures it doesn't drop behind home bar on mobile */
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  padding: 12px 16px;
  border-radius: var(--widget-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.4s ease;

  .map-expanded & {
    max-width: 500px;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    /* Lifted slightly higher in expanded mode */
    bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  }
}

.location-text {
  display: flex;
  flex-direction: column;
  strong {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
    .map-expanded & {
      font-size: 16px;
      max-width: 300px;
    }
  }
}

.mode-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clock-section {
  text-align: right;
}

.clock-time {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-color);
  line-height: 1;
  .map-expanded & {
    font-size: 20px;
  }
}

.clock-date {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
  text-transform: uppercase;
}

:deep(.leaflet-control-container .leaflet-top),
:deep(.leaflet-control-container .leaflet-bottom) {
  display: none !important;
}
</style>
