<template>
  <div class="map-wrapper-outer">
    <div
      class="map-backdrop"
      :class="{ 'map-backdrop-active': isExpanded }"
      @click="collapseWidget"
    ></div>

    <UIWidgetView
      title="Map"
      class="map-widget-fixed"
      :class="{ 'map-expanded': isExpanded }"
      @click="expandWidget"
    >
      <template #header-suffix>
        <div class="map-header-controls">
          <button class="map-icon-btn" @click.stop="toggleLayer" title="Toggle Satellite">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2L2 7L12 12L22 7L12 2Z" />
            </svg>
          </button>
          <button v-if="isExpanded" class="map-icon-btn" @click.stop="collapseWidget">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </template>

      <div class="map-search-bar" v-if="isExpanded || searchQuery">
        <input
          v-model="searchQuery"
          @keydown.enter="handleSearch"
          @click.stop
          placeholder="Search location..."
        />
      </div>

      <div class="map-body-content">
        <div id="map" ref="mapContainer"></div>

        <div class="map-info-footer">
          <div class="location-text">
            <strong>{{ locationTitle }}</strong>
            <span>{{ locationSubtitle }}</span>
          </div>
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,11L3,2L6,21L10.5,13.5L21,11Z" />
            </svg>
          </div>
        </div>
      </div>
    </UIWidgetView>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  location: { type: String, default: 'London' },
})

// State
const isExpanded = ref(false)
const currentMode = ref('standard')
const searchQuery = ref('')
const locationTitle = ref('Loading...')
const locationSubtitle = ref('...')
const mapContainer = ref(null)

// Leaflet
let map = null
let tileLayer = null
let marker = null

const expandedZoom = 16
const initialZoom = 15
const standardTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const satelliteTiles =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

// Logic
const geocodeLocation = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
    )
    const data = await res.json()
    return data[0]
  } catch (e) {
    return null
  }
}

const initMap = async () => {
  let lat = 51.5074,
    lng = -0.1278
  const data = await geocodeLocation(props.location)
  if (data) {
    lat = parseFloat(data.lat)
    lng = parseFloat(data.lon)
    locationTitle.value = data.display_name.split(',')[0]
    locationSubtitle.value = data.display_name.split(',').slice(1, 3).join(',')
  }

  map = L.map(mapContainer.value, {
    center: [lat, lng],
    zoom: initialZoom,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    attributionControl: false,
  })

  tileLayer = L.tileLayer(standardTiles, { maxZoom: 19 }).addTo(map)
  const pulseIcon = L.divIcon({
    className: 'map-custom-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  marker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map)
}

const expandWidget = () => {
  if (isExpanded.value) return
  isExpanded.value = true
  if (map) {
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    setTimeout(() => {
      map.invalidateSize()
      map.setZoom(expandedZoom)
    }, 300)
  }
}

const collapseWidget = (e) => {
  e?.stopPropagation()
  isExpanded.value = false
  if (map) {
    map.dragging.disable()
    map.scrollWheelZoom.disable()
    setTimeout(() => {
      map.invalidateSize()
      map.flyTo(marker.getLatLng(), initialZoom)
    }, 300)
  }
}

const toggleLayer = () => {
  currentMode.value = currentMode.value === 'standard' ? 'satellite' : 'standard'
  tileLayer.setUrl(currentMode.value === 'satellite' ? satelliteTiles : standardTiles)
}

const handleSearch = async () => {
  const res = await geocodeLocation(searchQuery.value)
  if (res) {
    const lat = parseFloat(res.lat),
      lng = parseFloat(res.lon)
    map.flyTo([lat, lng], expandedZoom)
    marker.setLatLng([lat, lng])
    locationTitle.value = res.display_name.split(',')[0]
  }
}

onMounted(() => initMap())
</script>

<style lang="scss">
.map-custom-pin {
  background: var(--map-accent, #007aff);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
}
.map-custom-pin::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  opacity: 0.6;
  animation: map-pulse 2s infinite;
  z-index: -1;
}
@keyframes map-pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}
</style>

<style lang="scss" scoped>
.map-wrapper-outer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* FIXED: Apply styles directly to the class. 
  Since this class is passed to UIWidgetView, it becomes the root class of that component.
*/
.map-widget-fixed {
  width: 300px;
  height: 300px;
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 10;
  cursor: pointer;
  
  /* CRITICAL OVERRIDES for Edge-to-Edge Map */
  padding: 0 !important;
  gap: 0 !important;
  display: block !important; /* Break flex layout to allow absolute positioning */
  position: relative;
  overflow: hidden;
}

.map-widget-fixed:hover {
  transform: translateY(-2px);
}

.map-expanded {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) !important;
  width: 90vw;
  height: 68vh;
  z-index: 100;
  cursor: default;
  margin: 0;
}

/* DEEP SELECTORS for UIWidgetView Children
*/

/* 1. Header: Float on top */
.map-widget-fixed :deep(.ui-widget-header) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 16px 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent);
  pointer-events: none;
}

/* 2. Title: Ensure visibility */
.map-widget-fixed :deep(.ui-widget-title) {
  color: white !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  font-weight: 700;
}

/* 3. Body: Fill remaining space completely */
.map-widget-fixed :deep(.ui-widget-body) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  flex: none !important; /* Disable flex shrinking/growing */
}

/* Internals */
.map-body-content {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
  background: #eee;
}

.map-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
  z-index: 90;
  backdrop-filter: blur(5px);
}
.map-backdrop-active {
  opacity: 1;
  pointer-events: auto;
}

.map-header-controls {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

.map-icon-btn {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}
.map-icon-btn:hover {
  background: rgba(0, 0, 0, 0.6);
}

.map-search-bar {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  z-index: 50;
}
.map-search-bar input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: inherit;
}

.map-info-footer {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.location-text {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  overflow: hidden;
  color: #333;
}
.location-text strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}
.nav-icon {
  width: 36px;
  height: 36px;
  background: #007aff;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 10px;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
}
.nav-icon svg {
  width: 18px;
  height: 18px;
  transform: rotate(45deg);
}
</style>
