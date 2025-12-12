<!-- MKMapView.vue -->
<template>
  <div class="mk-map-view" :style="mapStyle">
    <div class="mk-map-container">
      <div class="mk-compass" @click="resetView">⌘</div>
      <div ref="mapContainer" class="mk-map"></div>
      <div class="mk-controls">
        <div class="mk-button-group">
          <button class="mk-button" @click="zoomIn">+</button>
          <button class="mk-button" @click="zoomOut">−</button>
        </div>
        <button class="mk-location-button" @click="resetView">⊙</button>
      </div>
      <div class="mk-map-type-control">
        <button
          v-for="type in mapTypes"
          :key="type.value"
          class="mk-map-type-button"
          :class="{ active: currentMapType === type.value }"
          @click="changeMapType(type.value)"
        >
          {{ type.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  lat: {
    type: Number,
    default: 37.7749,
  },
  lng: {
    type: Number,
    default: -122.4194,
  },
  zoom: {
    type: Number,
    default: 13,
  },
  markerTitle: {
    type: String,
    default: 'San Francisco',
  },
  width: {
    type: [String, Number],
    default: '100%',
  },
  height: {
    type: [String, Number],
    default: 600,
  },
})

const mapStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const currentMapType = ref('standard')

const mapTypes = [
  { value: 'standard', label: 'Standard' },
  { value: 'satellite', label: 'Satellite' },
]

const initMap = () => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([props.lat, props.lng], props.zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map.value)

  addMarker(props.lat, props.lng, props.markerTitle)
}

const addMarker = (lat, lng, title) => {
  const icon = L.divIcon({
    className: 'mk-annotation',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  })

  const marker = L.marker([lat, lng], { icon: icon }).addTo(map.value)
  if (title) {
    marker.bindPopup(`<strong>${title}</strong>`)
  }
  markers.value.push(marker)
}

const zoomIn = () => {
  if (map.value) {
    map.value.zoomIn()
  }
}

const zoomOut = () => {
  if (map.value) {
    map.value.zoomOut()
  }
}

const resetView = () => {
  if (map.value) {
    map.value.setView([props.lat, props.lng], props.zoom)
  }
}

const changeMapType = (type) => {
  if (!map.value) return

  currentMapType.value = type

  map.value.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.value.removeLayer(layer)
    }
  })

  if (type === 'satellite') {
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
      },
    ).addTo(map.value)
  } else {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map.value)
  }
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.mk-map-view {
  display: block;
  max-width: 100%;
  border-radius: var(--radius-medium);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.mk-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
}

.mk-map {
  width: 100%;
  height: 100%;
}

.mk-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mk-button-group {
  background: var(--control-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--control-border);
}

.mk-button {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  font-size: 20px;
  font-weight: 500;
  transition: background 0.15s ease;
  border-bottom: 0.5px solid var(--control-divider);
}

.mk-button:last-child {
  border-bottom: none;
}

.mk-button:active {
  background: var(--control-hover);
}

.mk-location-button {
  background: var(--control-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--control-border);
  width: 44px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  font-size: 20px;
  transition: background 0.15s ease;
}

.mk-location-button:active {
  background: var(--control-hover);
}

.mk-map-type-control {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  background: var(--control-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  padding: 8px;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--control-border);
}

.mk-map-type-button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--accent-color);
  font-weight: 500;
  transition: background 0.15s ease;
  border-radius: 6px;
}

.mk-map-type-button:active {
  background: var(--control-hover);
}

.mk-map-type-button.active {
  background: var(--accent-color);
  color: var(--bg-primary);
}

.mk-compass {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  background: var(--control-bg);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  border: 0.5px solid var(--control-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mk-compass:active {
  background: var(--control-hover);
}

:deep(.mk-annotation) {
  background: var(--accent-destructive);
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 3px solid var(--bg-primary);
  box-shadow: var(--shadow-lg);
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: var(--radius-medium);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.leaflet-popup-tip) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
