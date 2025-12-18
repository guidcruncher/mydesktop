<script setup>
import { ref, onMounted, nextTick, shallowRef, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Props ---
const props = defineProps({
  defaultLat: {
    type: Number,
    default: 51.505
  },
  defaultLng: {
    type: Number,
    default: -0.09
  },
  defaultLabel: {
    type: String,
    default: "London"
  },
  zoomLevelWidget: {
    type: Number,
    default: 14
  },
  zoomLevelFull: {
    type: Number,
    default: 15
  }
});

// --- State ---
const isOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const currentLabel = ref(props.defaultLabel);
const isSatellite = ref(false);

// Refs for DOM elements
const widgetMapContainer = ref(null);
const fullMapContainer = ref(null);

// Shallow Refs for Leaflet instances (prevents Proxy overhead issues)
const widgetMap = shallowRef(null);
const fullMap = shallowRef(null);
const currentMarker = shallowRef(null);
const standardLayer = shallowRef(null);
const satelliteLayer = shallowRef(null);

let searchTimeout = null;

// --- Lifecycle ---
onMounted(() => {
  initWidgetMap();
  initFullMap();
});

// --- Methods ---

const initWidgetMap = () => {
  if (!widgetMapContainer.value) return;

  widgetMap.value = L.map(widgetMapContainer.value, {
    center: [props.defaultLat, props.defaultLng],
    zoom: props.zoomLevelWidget,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false
  });

  // Widget Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'leaflet-layer-default'
  }).addTo(widgetMap.value);

  // Widget Marker
  L.circleMarker([props.defaultLat, props.defaultLng], {
    radius: 8,
    fillColor: 'var(--map-accent-color)',
    color: '#ffffff',
    weight: 3,
    opacity: 1,
    fillOpacity: 1
  }).addTo(widgetMap.value);
};

const initFullMap = () => {
  if (!fullMapContainer.value) return;

  fullMap.value = L.map(fullMapContainer.value, {
    center: [props.defaultLat, props.defaultLng],
    zoom: props.zoomLevelFull,
    zoomControl: false
  });

  // Standard Layer
  standardLayer.value = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    className: 'leaflet-layer-default'
  });

  // Satellite Layer
  satelliteLayer.value = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri...'
  });

  // Add Default Layer
  standardLayer.value.addTo(fullMap.value);

  // Add Zoom Control
  L.control.zoom({ position: 'bottomright' }).addTo(fullMap.value);

  addMarkerToFullMap(props.defaultLat, props.defaultLng, props.defaultLabel);
};

const addMarkerToFullMap = (lat, lng, title) => {
  if (!fullMap.value) return;

  if (currentMarker.value) {
    fullMap.value.removeLayer(currentMarker.value);
  }

  currentMarker.value = L.marker([lat, lng]).addTo(fullMap.value)
    .bindPopup(title)
    .openPopup();

  fullMap.value.setView([lat, lng], props.zoomLevelFull);
};

// --- Actions ---

const openModal = async () => {
  isOpen.value = true;
  // Wait for transition/DOM update then invalidate size
  await nextTick();
  setTimeout(() => {
    if (fullMap.value) {
      fullMap.value.invalidateSize();
      if (currentMarker.value) {
        fullMap.value.panTo(currentMarker.value.getLatLng());
      }
    }
  }, 300);
};

const closeModal = () => {
  isOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
};

const toggleSatellite = () => {
  if (!fullMap.value) return;
  
  if (isSatellite.value) {
    // Switch to Standard
    fullMap.value.removeLayer(satelliteLayer.value);
    standardLayer.value.addTo(fullMap.value);
  } else {
    // Switch to Satellite
    fullMap.value.removeLayer(standardLayer.value);
    satelliteLayer.value.addTo(fullMap.value);
  }
  isSatellite.value = !isSatellite.value;
};

// --- Search Logic ---

const handleSearchInput = (e) => {
  const query = e.target.value.trim();
  searchQuery.value = query;

  if (searchTimeout) clearTimeout(searchTimeout);

  if (query.length < 3) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 500);
};

const performSearch = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    searchResults.value = data;
  } catch (error) {
    console.error("Search failed:", error);
  }
};

const selectLocation = (item) => {
  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);
  
  // Format Name
  const displayName = item.display_name.split(',').slice(0, 3).join(',');
  const shortName = item.name || displayName.split(',')[0];

  // Update State
  currentLabel.value = shortName;
  searchQuery.value = displayName;
  searchResults.value = []; // Clear results

  // Update Maps
  addMarkerToFullMap(lat, lon, displayName);
  
  if (widgetMap.value) {
    widgetMap.value.setView([lat, lon], props.zoomLevelWidget);
    // Note: In a real app we'd update the widget marker position here too, 
    // but for this demo we just pan the view.
  }
};

</script>

<template>
  <div class="map-component-root">
    
    <!-- Widget View -->
    <div class="map-widget-wrapper" @click="openModal">
      <div class="map-widget-header">
        <div class="map-widget-title">Maps</div>
        <div class="map-widget-location-name">{{ currentLabel }}</div>
      </div>
      <div ref="widgetMapContainer" class="map-widget-map"></div>
    </div>

    <!-- Full View Modal -->
    <div class="map-full-view-overlay" :class="{ 'map-active': isOpen }">
      <div class="map-modal-header">
        <button class="map-close-btn" @click.stop="closeModal">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="map-search-container">
          <div class="map-search-icon"></div>
          <input 
            type="text" 
            class="map-search-input" 
            placeholder="Search for a place or address"
            :value="searchQuery"
            @input="handleSearchInput"
          >
          
          <!-- Results Dropdown -->
          <div v-if="searchResults.length > 0" class="map-search-results">
            <div 
              v-for="(result, index) in searchResults" 
              :key="index" 
              class="map-result-item"
              @click="selectLocation(result)"
            >
              {{ result.display_name.split(',').slice(0, 3).join(',') }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="map-full-map-container">
        <div ref="fullMapContainer" style="width:100%; height:100%;"></div>
        
        <!-- Satellite Toggle Button -->
        <button 
          class="map-view-toggle" 
          :class="{ 'map-toggle-active': isSatellite }"
          @click="toggleSatellite" 
          title="Toggle Satellite View"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

  </div>
</template>

<style>
/* Global Styles & Variables 
  We use a non-scoped block for variables and Leaflet overrides 
*/
:root {
  /* Light Theme Variables */
  --map-bg-primary: #ffffff;
  --map-bg-secondary: #f2f2f7;
  --map-bg-blur: rgba(255, 255, 255, 0.8);
  --map-text-primary: #000000;
  --map-text-secondary: #8e8e93;
  --map-accent-color: #007aff;
  --map-divider-color: #c6c6c8;
  --map-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  --map-widget-radius: 22px;
  --map-search-bg: #e3e3e8;
  --map-btn-bg: #ffffff;
  --map-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --map-transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Theme Variables */
    --map-bg-primary: #1c1c1e;
    --map-bg-secondary: #000000;
    --map-bg-blur: rgba(30, 30, 30, 0.7);
    --map-text-primary: #ffffff;
    --map-text-secondary: #98989d;
    --map-accent-color: #0a84ff;
    --map-divider-color: #38383a;
    --map-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    --map-search-bg: #2c2c2e;
    --map-btn-bg: #2c2c2e;
  }
}

/* Leaflet Overrides */
.leaflet-container {
  font-family: var(--map-font-family) !important;
  background: var(--map-bg-secondary) !important;
}

.leaflet-control-attribution {
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 4px;
  padding: 0 4px;
  font-size: 10px;
  color: var(--map-text-secondary);
}

@media (prefers-color-scheme: dark) {
  .leaflet-control-attribution {
    background: rgba(0, 0, 0, 0.5) !important;
  }
  /* Invert map tiles for dark mode using CSS filter, but ONLY for the default layer */
  .leaflet-layer-default .leaflet-tile {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
}
</style>

<style scoped>
/* Component Scoped Styles */

.map-component-root {
  font-family: var(--map-font-family);
  display: inline-block;
}

/* --- Widget Styles --- */
.map-widget-wrapper {
  position: relative;
  width: 340px;
  height: 340px; 
  border-radius: var(--map-widget-radius);
  box-shadow: var(--map-shadow);
  overflow: hidden;
  background: var(--map-bg-primary);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.map-widget-wrapper:active {
  transform: scale(0.98);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.map-widget-header {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 400;
  display: flex;
  flex-direction: column;
  pointer-events: none; 
}

.map-widget-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--map-accent-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  background: var(--map-bg-blur);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 4px 8px;
  border-radius: 6px;
  align-self: flex-start;
}

.map-widget-location-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--map-text-primary);
  text-shadow: 0 1px 4px rgba(255,255,255,0.5);
}

@media (prefers-color-scheme: dark) {
  .map-widget-location-name {
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  }
}

.map-widget-map {
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* --- Full View / Modal Styles --- */
.map-full-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--map-bg-secondary);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.95);
  transition: var(--map-transition);
  display: flex;
  flex-direction: column;
}

.map-full-view-overlay.map-active {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.map-modal-header {
  height: 60px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--map-bg-blur);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid var(--map-divider-color);
  z-index: 1002;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.map-close-btn {
  background: var(--map-search-bg);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--map-accent-color);
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.map-close-btn:hover {
  opacity: 0.8;
}

.map-search-container {
  flex-grow: 1;
  position: relative;
}

.map-search-input {
  width: 100%;
  background: var(--map-search-bg);
  border: none;
  padding: 8px 12px 8px 36px;
  border-radius: 10px;
  font-size: 17px;
  color: var(--map-text-primary);
  outline: none;
  height: 36px;
  box-sizing: border-box;
}

.map-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid var(--map-text-secondary);
  border-radius: 50%;
  pointer-events: none;
}
.map-search-icon::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 6px;
  background: var(--map-text-secondary);
  bottom: -5px;
  right: -2px;
  transform: rotate(-45deg);
}

.map-search-results {
  position: absolute;
  top: 45px;
  left: 0;
  right: 0;
  background: var(--map-bg-blur);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 12px;
  box-shadow: var(--map-shadow);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1003;
}

.map-result-item {
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--map-divider-color);
  color: var(--map-text-primary);
  font-size: 15px;
  cursor: pointer;
}
.map-result-item:last-child {
  border-bottom: none;
}
.map-result-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.map-full-map-container {
  width: 100%;
  height: 100%;
  z-index: 1001;
  position: relative;
}

/* View Toggle Button */
.map-view-toggle {
  position: absolute;
  top: 90px;
  right: 16px;
  width: 44px;
  height: 44px;
  background: var(--map-btn-bg);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1005;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--map-accent-color);
  transition: transform 0.2s, background-color 0.2s, color 0.2s;
}
.map-view-toggle:active {
  transform: scale(0.95);
}
.map-view-toggle svg {
  width: 24px;
  height: 24px;
}

.map-toggle-active {
  background: var(--map-accent-color);
  color: #ffffff;
}
</style>

