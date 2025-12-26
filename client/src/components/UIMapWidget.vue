<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Define Props
const props = defineProps({
  location: {
    type: String,
    default: 'London',
  },
})

// State
const isExpanded = ref(false)
const currentMode = ref('standard') // 'standard' or 'satellite'
const searchQuery = ref('')
const locationTitle = ref('Loading...')
const locationSubtitle = ref('...')

// Refs to DOM elements
const mapContainer = ref(null)

// Leaflet Instances (non-reactive for performance)
let map = null
let tileLayer = null
let marker = null

// Constants
const expandedZoom = 16
const initialZoom = 15
const standardTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const satelliteTiles =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

// --- API & Logic ---

const geocodeLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
    )
    const data = await response.json()
    if (data && data.length > 0) return data[0]
    return null
  } catch (error) {
    console.error('Geocoding failed', error)
    return null
  }
}

const initMap = async () => {
  // 1. Resolve Initial Location
  let lat = 51.5074 // Fallback
  let lng = -0.1278

  const locationData = await geocodeLocation(props.location)

  if (locationData) {
    lat = parseFloat(locationData.lat)
    lng = parseFloat(locationData.lon)

    // Parse Display Name for UI
    const parts = locationData.display_name.split(',')
    locationTitle.value = parts[0]
    locationSubtitle.value = parts.slice(1, 3).join(',').trim()
  } else {
    locationTitle.value = props.location
    locationSubtitle.value = 'Location not found'
  }

  // 2. Initialize Leaflet
  map = L.map(mapContainer.value, {
    center: [lat, lng],
    zoom: initialZoom,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    attributionControl: false,
  })

  // 3. Add Layer
  tileLayer = L.tileLayer(standardTiles, { maxZoom: 19 }).addTo(map)

  // 4. Add Custom Marker
  const pulseIcon = L.divIcon({
    className: 'map-custom-pin', // Styled in global CSS below
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  marker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map)

  // 5. Set Initial Mode Class
  mapContainer.value.classList.add('map-standard-mode')
}

// --- Interactions ---

const expandWidget = () => {
  if (isExpanded.value) return
  isExpanded.value = true

  if (map) {
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    map.doubleClickZoom.enable()
    map.touchZoom.enable()
    map.keyboard.enable()
    if (map.tap) map.tap.enable()

    // Resize map after CSS transition
    setTimeout(() => {
      map.invalidateSize()
      map.setZoom(expandedZoom)
    }, 300)
  }
}

const collapseWidget = (e) => {
  e?.stopPropagation()
  isExpanded.value = false
  searchQuery.value = ''

  if (map) {
    map.dragging.disable()
    map.scrollWheelZoom.disable()
    map.doubleClickZoom.disable()
    map.touchZoom.disable()
    map.keyboard.disable()
    if (map.tap) map.tap.disable()

    setTimeout(() => {
      map.invalidateSize()
      map.flyTo(marker.getLatLng(), initialZoom, { animate: true, duration: 1 })
    }, 300)
  }
}

const toggleLayer = (e) => {
  e?.stopPropagation()
  currentMode.value = currentMode.value === 'standard' ? 'satellite' : 'standard'

  if (currentMode.value === 'satellite') {
    mapContainer.value.classList.remove('map-standard-mode')
    tileLayer.setUrl(satelliteTiles)
  } else {
    mapContainer.value.classList.add('map-standard-mode')
    tileLayer.setUrl(standardTiles)
  }
}

const handleSearch = async () => {
  if (!searchQuery.value) return

  const result = await geocodeLocation(searchQuery.value)
  if (result) {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    // Fly to new location
    map.flyTo([lat, lng], expandedZoom, { animate: true, duration: 1.5 })
    marker.setLatLng([lat, lng])

    // Update Text
    const parts = result.display_name.split(',')
    locationTitle.value = parts[0]
    locationSubtitle.value = parts.slice(1, 3).join(',').trim()

    // Unfocus input
    document.activeElement.blur()
  } else {
    alert('Location not found')
  }
}

onMounted(() => {
  initMap()
})
</script>

<template>
  <div class="map-wrapper">
    <div
      class="map-backdrop"
      :class="{ 'map-backdrop-active': isExpanded }"
      @click="collapseWidget"
    ></div>

    <div class="map-widget-container" :class="{ 'map-expanded': isExpanded }" @click="expandWidget">
      <div class="map-search-container surface">
        <svg
          class="map-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="map-search-input"
          placeholder="Search Maps"
          v-model="searchQuery"
          @keydown.enter="handleSearch"
          @click.stop
        />
      </div>

      <div class="map-ui-controls">
        <button
          class="map-control-btn map-close-btn"
          @click="collapseWidget"
          aria-label="Close Map"
        >
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <button
          class="map-control-btn map-layer-btn"
          @click="toggleLayer"
          aria-label="Toggle Satellite View"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path
              d="M2 17L12 22L22 17"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div id="map" ref="mapContainer"></div>

      <div class="map-widget-overlay surface">
        <div class="map-location-info">
          <span class="map-location-title">{{ locationTitle }}</span>
          <span class="map-location-subtitle">{{ locationSubtitle }}</span>
        </div>
        <div class="map-navigate-icon">
          <svg viewBox="0 0 24 24">
            <path d="M21,11L3,2L6,21L10.5,13.5L21,11Z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dark-mode {
  .map-standard-mode .leaflet-tile-pane {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
}
</style>

<style lang="scss" scoped>
/* Wrapper to handle positioning */
.map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

/* --- BACKDROP --- */
.map-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  transition: opacity 0.5s ease;
}

.map-backdrop-active {
  opacity: 1;
  pointer-events: auto;
}

/* --- WIDGET CONTAINER --- */
.map-widget-container {
  width: 300px;
  height: 300px;
  background-color: var(--map-widget-bg);
  border-radius: var(--surface-radius);
  box-shadow: var(--map-shadow);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  z-index: 91; /* Just above backdrop */
  transition: all 0.6s cubic-bezier(0.32, 0.72, 0, 1);
  transform-origin: center center;
  font-family: var(--font-family);
}

.map-widget-container:not(.map-expanded):active {
  transform: scale(0.96);
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

/* --- EXPANDED STATE (90% View) --- */
.map-widget-container.map-expanded {
  position: fixed;
  /* Center on screen */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* 90% Dimensions */
  width: 90vw;
  height: 68vh;

  /* Ensure rounded corners persist */
  border-radius: var(--surface-radius);

  z-index: 100;
  cursor: default;
  box-shadow: var(--map-expanded-shadow);
  margin: 0;
}

/* --- UI CONTROLS (Buttons) --- */
.map-ui-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 20;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.map-control-btn {
  width: 44px;
  height: 44px;
  background: var(--map-btn-bg); /* Solid color */
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s ease,
    transform 0.2s ease;
  cursor: pointer;
  color: var(--map-btn-icon);
  margin-bottom: 12px;
  box-shadow: var(--map-btn-shadow);
}

.map-control-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.map-control-btn:active {
  transform: scale(0.9);
}

.map-widget-container.map-expanded .map-control-btn {
  opacity: 1;
  pointer-events: auto;
  transition-delay: 0.2s;
}

.map-close-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
}

/* --- SEARCH BAR --- */
.map-search-container {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  width: 90%;
  max-width: 400px;
  background: var(--map-input-bg); /* Solid or high opacity */
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 50px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: var(--map-btn-shadow);
  z-index: 25;
}

.map-widget-container.map-expanded .map-search-container {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
  transition-delay: 0.1s;
  top: 20px;
}

.map-search-icon {
  color: var(--ui-text-secondary);
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

.map-search-input {
  background: transparent;
  border: none;
  font-size: 17px;
  color: var(--ui-text-primary);
  width: 100%;
  height: 100%;
  font-family: inherit;
}

.map-search-input::placeholder {
  color: var(--ui-text-secondary);
}

/* --- MAP ELEMENT --- */
#map {
  width: 100%;
  height: 100%;
  z-index: 1;
  background: var(--map-widget-bg);
  transition: background-color 0.3s;
}

/* --- INFO OVERLAY --- */
.map-widget-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: var(--map-overlay-bg); /* Solid color */
  border-radius: 18px;
  padding: 14px 18px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--map-overlay-shadow);
  transition:
    bottom 0.5s cubic-bezier(0.32, 0.72, 0, 1),
    max-width 0.5s ease,
    left 0.5s ease;
}

.map-widget-container.map-expanded .map-widget-overlay {
  bottom: 40px;
  max-width: 400px;
  left: 50%;
  transform: translateX(-50%);
  right: auto;
  width: 90%;
}

.map-location-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-location-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ui-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-location-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--ui-text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-navigate-icon {
  width: 36px;
  height: 36px;
  background-color: var(--map-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  flex-shrink: 0;
  margin-left: 10px;
}

.map-navigate-icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transform: rotate(45deg);
  margin-left: -2px;
  margin-top: 2px;
}

/* --- CUSTOM PIN & PULSE --- */
:global(.map-custom-pin) {
  background-color: var(--map-accent);
  border: 3px solid var(--map-pin-border);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  transition: border-color 0.3s;
}

:global(.map-custom-pin::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--map-accent);
  opacity: 0.6;
  animation: map-pulse 2s infinite;
  z-index: -1;
}

@keyframes map-pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  70% {
    transform: translate(-50%, -50%) scale(3.5);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Hide Leaflet Controls */
:global(.leaflet-control-attribution) {
  display: none;
}
:global(.leaflet-control-zoom) {
  display: none !important;
}
</style>
