import { shallowRef, markRaw } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export function useMapController() {
  // shallowRef is CRITICAL for Leaflet performance in Vue 3
  const mapInstance = shallowRef(null)

  let baseLayer = null
  let overlayLayer = null
  let clickMarker = null
  let mainMarker = null

  const layersConfig = {
    standard: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxNativeZoom: 19 },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxNativeZoom: 17,
    },
    topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maxNativeZoom: 18,
    },
    railway: {
      baseUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      overlayUrl: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
      maxNativeZoom: 19,
    },
    transport: { url: 'https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', maxNativeZoom: 18 },
  }

  const legendConfig = {
    standard: [
      { label: 'Roads', color: '#ffffff', border: '1px solid #999' },
      { label: 'Parks', color: '#c8facc' },
      { label: 'Water', color: '#aad3df' },
      { label: 'Buildings', color: '#e0dfdf' },
    ],
    satellite: [],
    topo: [
      { label: 'Forest', color: '#add19e' },
      { label: 'Contour Lines', color: '#8d7658', border: '1px solid #8d7658' },
      { label: 'Elevation', color: '#f5f5f2' },
    ],
    railway: [
      { label: 'High Speed', color: '#b60000' },
      { label: 'Main Line', color: '#ff7f00' },
      { label: 'Secondary', color: '#ffd700' },
      { label: 'Subway', color: '#003399' },
    ],
    transport: [
      { label: 'Bus', color: '#e40000' },
      { label: 'Tram', color: '#0066cc' },
      { label: 'Subway/Metro', color: '#003399' },
      { label: 'Train', color: '#555555' },
    ],
  }

  const initMap = async (element, lat, lng, zoom = 15, onClickCallback) => {
    if (mapInstance.value) return

    const map = L.map(element, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      attributionControl: false,
      preferCanvas: true,
    })

    mapInstance.value = markRaw(map)

    baseLayer = L.tileLayer(layersConfig.standard.url, {
      maxZoom: 20,
      maxNativeZoom: 19,
    }).addTo(map)

    const pulseIcon = L.divIcon({
      className: 'map-custom-pin',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    mainMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map)

    if (onClickCallback) {
      map.on('click', (e) => onClickCallback(e))
    }
  }

  const setLayerMode = (mode) => {
    if (!mapInstance.value || !L) return

    if (overlayLayer) {
      mapInstance.value.removeLayer(overlayLayer)
      overlayLayer = null
    }

    const config = layersConfig[mode]

    if (mode === 'railway') {
      baseLayer.setUrl(config.baseUrl)
      baseLayer.options.maxNativeZoom = config.maxNativeZoom
      overlayLayer = L.tileLayer(config.overlayUrl, {
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(mapInstance.value)
    } else {
      baseLayer.options.maxNativeZoom = config.maxNativeZoom
      baseLayer.setUrl(config.url)
    }
    baseLayer.redraw()
  }

  const setClickMarker = (lat, lng) => {
    if (!mapInstance.value || !L) return
    if (clickMarker) mapInstance.value.removeLayer(clickMarker)

    const clickIcon = L.divIcon({
      className: 'map-click-pin',
      html: '<div class="pin-inner"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    clickMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(mapInstance.value)
    mapInstance.value.flyTo([lat, lng], mapInstance.value.getZoom())
  }

  const clearClickMarker = () => {
    if (clickMarker && mapInstance.value) {
      mapInstance.value.removeLayer(clickMarker)
      clickMarker = null
    }
  }

  const setInteractions = (enable) => {
    const map = mapInstance.value
    if (!map) return
    if (enable) {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
    } else {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
    }
  }

  const resize = () => {
    if (mapInstance.value) mapInstance.value.invalidateSize()
  }

  const updateMainMarker = (lat, lng, zoom) => {
    if (!mapInstance.value || !mainMarker) return
    mapInstance.value.flyTo([lat, lng], zoom)
    mainMarker.setLatLng([lat, lng])
  }

  return {
    mapInstance,
    initMap,
    setLayerMode,
    setClickMarker,
    clearClickMarker,
    setInteractions,
    resize,
    updateMainMarker,
    legendConfig,
  }
}
