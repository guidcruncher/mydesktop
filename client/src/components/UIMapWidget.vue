<template>
  <div
    class="map-wrapper-outer"
    :class="{
      'dark-mode': isDarkMode,
      'mode-satellite': currentMode === 'satellite',
    }"
  >
    <div
      class="map-backdrop"
      :class="{ 'map-backdrop-active': isExpanded }"
      @click="collapseWidget"
    ></div>

    <UIWidgetView
      class="map-widget-fixed"
      :class="{ 'map-expanded': isExpanded }"
      width="360px"
      height="360px"
    >
      <div class="map-body-content">
        <div
          v-if="!isExpanded"
          class="map-click-overlay"
          @click="expandWidget"
          title="Click to expand map"
        ></div>

        <div id="map" ref="mapContainerRef"></div>

        <LocationDetailCard
          v-if="isExpanded && selectedLocation"
          :location="selectedLocation"
          :loading="isLoadingDetails"
          :mode-label="currentModeLabel"
          @close="clearSelection"
        />

        <div v-if="isExpanded && showRailModal" class="rail-modal-overlay" @click.stop>
          <div class="rail-modal-content">
            <button class="rail-modal-close" @click="showRailModal = false">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <UIGBRailStationWidget
              :station-code="railStationCode"
              :location-name="selectedLocation?.name"
              :api-user="apiUser"
              :api-pass="apiPass"
              refresh-interval="30"
              width="500px"
              height="300px"
            />
          </div>
        </div>

        <div class="map-controls-group" v-if="isExpanded">
          <div class="map-search-container">
            <input
              v-model.lazy="searchQuery"
              @keydown.enter="handleSearch"
              @click.stop
              placeholder="Search..."
            />
          </div>

          <button class="map-control-btn" @click.stop="toggleLayer" :title="nextLayerName">
            <svg
              v-if="currentMode === 'standard'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
            <svg
              v-else-if="currentMode === 'satellite'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
            </svg>
            <svg
              v-else-if="currentMode === 'topo'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 3v18" />
              <path d="M18 3v18" />
              <path d="M6 8h12" />
              <path d="M6 16h12" />
            </svg>
            <svg
              v-else-if="currentMode === 'railway'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M5 21v-2" />
              <path d="M19 21v-2" />
              <circle cx="7" cy="16" r="1" />
              <circle cx="17" cy="16" r="1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
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

        <button
          v-if="isExpanded && currentLegend.length > 0"
          class="map-key-btn"
          :class="{ active: showLegend }"
          @click.stop="showLegend = !showLegend"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </button>

        <div v-if="isExpanded && showLegend && currentLegend.length > 0" class="map-legend-panel">
          <div class="legend-header">
            <span>Map Key</span>
            <button class="legend-close" @click="showLegend = false">&times;</button>
          </div>
          <div class="legend-items">
            <div v-for="(item, index) in currentLegend" :key="index" class="legend-item">
              <span
                class="legend-symbol"
                :style="{ background: item.color, border: item.border || 'none' }"
              ></span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="map-info-footer surface-nopad">
          <div class="location-text">
            <strong>{{ locationTitle }}</strong>
            <span>{{ locationSubtitle }}</span>
            <span class="mode-label">{{ currentModeLabel }}</span>
          </div>

          <button
            v-if="railStationCode"
            class="rail-departures-btn"
            @click.stop="showRailModal = true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="rail-icon"
            >
              <path d="M4 14l6-6 4 4 6-6" />
              <path d="M16 4h4v4" />
            </svg>
            <span>Departures</span>
          </button>
        </div>
      </div>
    </UIWidgetView>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import LocationDetailCard from './LocationDetailCard.vue'
import UIGBRailStationWidget from './UIGBRailStationWidget.vue'
import { useMapRepository } from '../composables/useMapRepository'
import { useMapController } from '../composables/useMapController'

const props = defineProps({
  location: { type: String, default: 'London' },
  apiUser: { type: String, default: '' },
  apiPass: { type: String, default: '' },
})

const isExpanded = ref(false)
const isDarkMode = computed(() => document.body.classList.contains('dark-mode'))
const currentMode = ref('standard')
const searchQuery = ref('')
const locationTitle = ref('Loading...')
const locationSubtitle = ref('...')
const showLegend = ref(false)
const showRailModal = ref(false)
const mapContainerRef = ref(null)

const selectedLocation = shallowRef(null)
const isLoadingDetails = ref(false)

const expandedZoom = 16
const initialZoom = 15

const { geocodeLocation, fetchFullDetails } = useMapRepository()
const {
  initMap,
  setLayerMode,
  setClickMarker,
  clearClickMarker,
  setInteractions,
  resize,
  updateMainMarker,
  legendConfig,
} = useMapController()

const currentLegend = computed(() => legendConfig[currentMode.value] || [])

// Extract CRS or TIPLOC code if available
const railStationCode = computed(() => {
  if (!selectedLocation.value || !selectedLocation.value.layerData) return null
  return (
    selectedLocation.value.layerData['CRS Code'] ||
    selectedLocation.value.layerData['TIPLOC'] ||
    null
  )
})

const nextLayerName = computed(() => {
  const map = {
    standard: 'Switch to Satellite',
    satellite: 'Switch to Topographic',
    topo: 'Switch to Railway',
    railway: 'Switch to Public Transport',
    transport: 'Switch to Standard',
  }
  return map[currentMode.value] || 'Switch'
})

const currentModeLabel = computed(() => {
  const labels = {
    standard: 'Street View',
    satellite: 'Satellite View',
    topo: 'Topographic View',
    railway: 'Railway Infrastructure',
    transport: 'Public Transport Map',
  }
  return labels[currentMode.value]
})

const toggleLayer = () => {
  const modes = ['standard', 'satellite', 'topo', 'railway', 'transport']
  const idx = modes.indexOf(currentMode.value)
  currentMode.value = modes[(idx + 1) % modes.length]
  setLayerMode(currentMode.value)
}

const handleMapClick = async (e) => {
  if (!isExpanded.value) return
  const { lat, lng } = e.latlng

  setClickMarker(lat, lng)

  // Reset modal state when selecting new location
  showRailModal.value = false
  isLoadingDetails.value = true

  selectedLocation.value = {
    lat,
    lng,
    name: 'Loading...',
    address: '...',
    weather: {},
    elevation: '...',
  }

  try {
    const details = await fetchFullDetails(lat, lng, currentMode.value)
    selectedLocation.value = details
    locationTitle.value = details.name
    locationSubtitle.value = `${details.county || ''}, ${details.country || ''}`
  } catch (err) {
    selectedLocation.value = { ...selectedLocation.value, name: 'Unavailable' }
  } finally {
    isLoadingDetails.value = false
  }
}

const clearSelection = () => {
  selectedLocation.value = null
  showRailModal.value = false
  clearClickMarker()
}

const handleSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 3) return
  const res = await geocodeLocation(searchQuery.value)
  if (res) {
    const lat = parseFloat(res.lat)
    const lng = parseFloat(res.lon)
    updateMainMarker(lat, lng, expandedZoom)
    locationTitle.value = res.display_name.split(',')[0]
  }
}

const expandWidget = () => {
  if (isExpanded.value) return
  isExpanded.value = true
  setInteractions(true)
  setTimeout(() => resize(), 350)
}

const collapseWidget = (e) => {
  e?.stopPropagation()
  isExpanded.value = false
  showLegend.value = false
  showRailModal.value = false
  clearSelection()
  setInteractions(false)
  setTimeout(() => resize(), 350)
}

onMounted(async () => {
  let lat = 51.5074,
    lng = -0.1278
  const data = await geocodeLocation(props.location)

  if (data) {
    lat = parseFloat(data.lat)
    lng = parseFloat(data.lon)
    locationTitle.value = data.display_name.split(',')[0]
    locationSubtitle.value = data.display_name.split(',').slice(1, 3).join(',')
  }

  await initMap(mapContainerRef.value, lat, lng, initialZoom, handleMapClick)
})

watch(currentMode, (newMode) => {
  if (!legendConfig[newMode] || legendConfig[newMode].length === 0) {
    showLegend.value = false
  }
})
</script>

<style lang="scss">
/* ... (Existing map pin styles remain unchanged) ... */
.map-custom-pin {
  background: var(--sys-primary);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  will-change: transform;
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
  will-change: transform, opacity;
}
.map-click-pin .pin-inner {
  width: 100%;
  height: 100%;
  background: var(--sys-danger);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform;
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
@keyframes popIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

<style lang="scss" scoped>
/* ... (Existing styles remain unchanged) ... */
.map-wrapper-outer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.dark-mode:not(.mode-satellite) :deep(.leaflet-tile-pane) {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
.map-widget-fixed {
  width: 300px;
  height: 300px;
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 10;
  padding: 0 !important;
  display: block !important;
  position: relative;
  overflow: hidden;
  will-change: transform, width, height, border-radius;
}
.map-widget-fixed:not(.map-expanded):hover {
  transform: translateY(-2px);
  box-shadow: var(--dropdown-shadow);
}
.map-expanded {
  position: fixed;
  inset: 0;
  width: 100vw !important;
  height: 100dvh !important;
  transform: none !important;
  z-index: 9999;
  margin: 0;
  border-radius: 0 !important;
}
.map-click-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  cursor: pointer;
  background: transparent;
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
  background: #eee;
}
.map-controls-group {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top, 0px) + 50px);
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 50;
}
.map-control-btn {
  width: 44px;
  height: 44px;
  background: var(--surface-bg);
  border: var(--surface-border);
  border-radius: var(--btn-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  backdrop-filter: blur(var(--surface-blur));
  transition: all 0.2s;
}
.map-control-btn:hover {
  background: var(--sys-primary);
  color: #fff;
}
.map-control-btn svg {
  width: 20px;
  height: 20px;
}
.exit-btn:hover {
  color: #fff;
  background: var(--sys-danger);
}
.map-search-container {
  width: 160px;
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  will-change: width;
}
.map-search-container:focus-within {
  width: 220px;
}
.map-search-container input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border-radius: var(--btn-radius);
  border: var(--surface-border);
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  color: var(--text-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  outline: none;
  font-size: 15px;
}
.map-key-btn {
  position: absolute;
  bottom: calc(90px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  width: 44px;
  height: 44px;
  background: var(--surface-bg);
  border: var(--surface-border);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.map-key-btn:hover,
.map-key-btn.active {
  background: var(--sys-primary);
  color: white;
}
.map-legend-panel {
  position: absolute;
  bottom: calc(140px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  width: 180px;
  background: var(--surface-bg);
  border: var(--surface-border);
  border-radius: var(--modal-radius);
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(var(--surface-blur));
  z-index: 51;
  color: var(--text-color);
  animation: fadeUp 0.3s ease-out;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-color);
  border-bottom: 1px solid rgba(var(--surface-rgb), 0.1);
  padding-bottom: 6px;
}
.legend-close {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: var(--text-tertiary);
  cursor: pointer;
}
.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.legend-symbol {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 8px;
  flex-shrink: 0;
}
.legend-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.map-info-footer {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  padding: 12px 16px; /* Slightly increased side padding */
  border-radius: var(--widget-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: env(safe-area-inset-bottom, 0px);
}
.map-expanded :deep(.map-info-footer) {
  max-width: 440px; /* Increased max width to accommodate button */
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}
.location-text {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  overflow: hidden;
  color: var(--text-color);
  margin-right: 12px;
}
.location-text strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}
.mode-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

/* --- New Rail Styles --- */
.rail-departures-btn {
  background: var(--sys-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.2s;
  flex-shrink: 0;
}
.rail-departures-btn:hover {
  transform: translateY(-1px);
  filter: brightness(110%);
}
.rail-departures-btn:active {
  transform: translateY(0);
}
.rail-icon {
  width: 16px;
  height: 16px;
}

.rail-modal-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 200;
  filter: drop-shadow(0 8px 30px rgba(0, 0, 0, 0.3));
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rail-modal-content {
  position: relative;
  background: transparent;
}
.rail-modal-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 30px;
  height: 30px;
  background: var(--surface-bg);
  border: var(--surface-border);
  color: var(--text-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 201;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.rail-modal-close:hover {
  background: var(--sys-danger);
  color: white;
}

/* Map Backdrop logic (unchanged) */
.map-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
  z-index: 90;
  backdrop-filter: blur(var(--overlay-blur));
}
.map-backdrop-active {
  opacity: 1;
  pointer-events: auto;
}
.map-widget-fixed :deep(.ui-widget-header) {
  pointer-events: none;
}
.map-widget-fixed :deep(.ui-widget-title) {
  color: white !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  font-weight: 700;
}
.map-widget-fixed :deep(.ui-widget-body) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  flex: none !important;
}
</style>
