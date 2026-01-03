<template>
  <div class="location-detail-card surface-nopad">
    <div class="detail-header">
      <span class="detail-label">Selected Location</span>
      <button class="detail-close" @click="$emit('close')">&times;</button>
    </div>

    <div v-if="loading" class="detail-loading">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <span>Fetching details...</span>
    </div>

    <div v-else-if="location" class="detail-content">
      <div class="detail-address">
        <strong>{{ location.name }}</strong>
        <span>{{ location.address }}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Coordinates</span>
          <div class="coords-wrapper">
            <span class="value">
              {{ location.lat.toFixed(4) }}, {{ location.lng.toFixed(4) }}
            </span>
            <button
              class="copy-btn"
              @click="copyCoordinates"
              :class="{ copied: isCoordsCopied }"
              aria-label="Copy coordinates"
            >
              <svg
                v-if="!isCoordsCopied"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Layer Info -->
        <div v-if="location.layerData" class="detail-item highlight layer-box">
          <span class="label">{{ modeLabel }} Info</span>
          <div class="layer-content">
            <div v-for="(val, key) in location.layerData" :key="key" class="layer-row">
              <span class="layer-key">{{ key }}:</span>
              <span class="layer-val">{{ val }}</span>
            </div>
          </div>
        </div>

        <!-- Weather & Elevation -->
        <div class="data-row">
          <div class="detail-item highlight weather-box">
            <span class="label">Weather</span>
            <div class="weather-value">
              <span class="temp">{{ location.weather.temp }}°C</span>
            </div>
            <span class="sub-label">{{ location.weather.desc }}</span>
          </div>

          <div class="detail-item highlight elevation-box">
            <span class="label">Elevation</span>
            <div class="elevation-value">{{ location.elevation }} <span class="unit">m</span></div>
            <span class="sub-label">Above Sea Level</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  location: Object,
  loading: Boolean,
  modeLabel: String,
})

const emit = defineEmits(['close'])
const isCoordsCopied = ref(false)

const copyCoordinates = async () => {
  if (!props.location) return
  const text = `${props.location.lat.toFixed(6)}, ${props.location.lng.toFixed(6)}`
  try {
    await navigator.clipboard.writeText(text)
    isCoordsCopied.value = true
    setTimeout(() => (isCoordsCopied.value = false), 2000)
  } catch (err) {
    // Fail silently
  }
}
</script>

<style scoped>
.location-detail-card {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top, 0px) + 50px);
  left: 16px;
  width: 340px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 140px);
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  border-radius: var(--modal-radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 60;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  contain: content;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: var(--surface-border);
  flex-shrink: 0;
}
.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: var(--text-tertiary);
}
.detail-close {
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
}
.detail-content {
  padding: 16px;
  color: var(--text-color);
  overflow-y: auto;
}
.detail-address {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}
.detail-address strong {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
}
.detail-address span {
  font-size: 13px;
  color: var(--text-secondary);
}
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.detail-item .label {
  color: var(--text-tertiary);
  margin-bottom: 2px;
}
.coords-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-item .value {
  color: var(--text-color);
  font-weight: 500;
  font-family: monospace;
}
.copy-btn {
  background: none;
  border: var(--surface-border);
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.copy-btn:hover {
  background: rgba(var(--surface-rgb), 0.1);
  color: var(--text-color);
}
.copy-btn.copied {
  color: var(--sys-success);
  background: rgba(var(--surface-rgb), 0.1);
  border-color: var(--sys-success);
}
.copy-btn svg {
  width: 14px;
  height: 14px;
}
.layer-box {
  border-left: 3px solid var(--sys-primary);
  background: rgba(var(--sys-primary-rgb), 0.08) !important;
}
.layer-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}
.layer-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 12px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 6px;
  margin-bottom: 2px;
}
.layer-key {
  color: var(--text-secondary);
  font-weight: 500;
  margin-right: 12px;
}
.layer-val {
  color: var(--text-color);
  font-weight: 700;
  text-align: right;
  word-break: break-word;
}
.data-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.detail-item.highlight {
  background: rgba(var(--surface-rgb), 0.05);
  padding: 10px;
  border-radius: 6px;
  border: var(--surface-border);
}
.weather-box .label,
.elevation-box .label {
  color: var(--sys-primary);
  font-weight: 600;
}
.weather-value .temp,
.elevation-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--sys-primary);
}
.elevation-value .unit {
  font-size: 12px;
  opacity: 0.7;
}
.detail-loading {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  contain: strict;
}
.spinner {
  width: 24px;
  height: 24px;
  animation: rotate 2s linear infinite;
  will-change: transform;
}
.spinner circle {
  stroke: var(--sys-primary);
  stroke-width: 3;
  stroke-dasharray: 60;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
  will-change: stroke-dasharray, stroke-dashoffset;
}
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
