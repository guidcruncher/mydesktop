<template>
  <div class="sysinfo-widget surface">
    <div class="sysinfo-header">
      <div class="sysinfo-title">System</div>
      <div class="sysinfo-badge" :class="{ online: !isOffline }">
        {{ isOffline ? 'Offline' : 'Online' }}
      </div>
    </div>

    <div class="sysinfo-row">
      <div class="sysinfo-icon-large">
        <i v-if="distroIcon" :class="distroIcon"></i>
        <i v-else class="fa-solid fa-server"></i>
      </div>
      <div class="sysinfo-main-text">
        <div class="sysinfo-hostname">{{ sysData.device.hostname }}</div>
        <div class="sysinfo-distro">{{ sysData.device.distro }}</div>
      </div>
    </div>

    <div class="sysinfo-divider"></div>

    <div class="sysinfo-stats-grid">
      <div class="sysinfo-stat-item">
        <div class="ring-container">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="`${sysData.cpu.percent}, 100`"
              :stroke="getColorForPercent(sysData.cpu.percent)"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="ring-text">
            <span class="ring-val">{{ sysData.cpu.percent }}</span>
            <span class="ring-unit">%</span>
          </div>
        </div>
        <div class="stat-label">CPU</div>
      </div>

      <div class="sysinfo-stat-item">
        <div class="ring-container">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="`${sysData.memory.percent}, 100`"
              :stroke="getColorForPercent(sysData.memory.percent)"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="ring-text">
            <span class="ring-val">{{ sysData.memory.percent }}</span>
            <span class="ring-unit">%</span>
          </div>
        </div>
        <div class="stat-label">RAM</div>
      </div>

      <div class="sysinfo-stat-item">
        <div class="ring-container">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="`${sysData.storage.percent}, 100`"
              :stroke="getColorForPercent(sysData.storage.percent)"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="ring-text">
            <span class="ring-val">{{ sysData.storage.percent }}</span>
            <span class="ring-unit">%</span>
          </div>
        </div>
        <div class="stat-label">Disk</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, onMounted, onUnmounted } from 'vue'

// Inject API Base URL or default to empty string
const API_URL = `${inject('API_BASE_URL', '')}/api/sysinfo`

interface Props {
  refreshinterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  refreshinterval: 5000,
})

// --- State ---
const isOffline = ref(false)
const timer = ref<number | null>(null)
const distroIcon = ref<string | null>(null)

// Default Data Structure
const sysData = ref({
  device: {
    distro: 'Detecting...',
    hostname: 'Localhost',
    platform: 'Linux',
  },
  cpu: { percent: 0 },
  memory: { percent: 0 },
  storage: {
    percent: 0,
    usedGB: '--',
    totalGB: '--',
  },
})

// --- Helpers ---

/**
 * Determines ring color based on percentage usage.
 * Returns CSS variable strings corresponding to system colors.
 */
const getColorForPercent = (percent: number) => {
  if (percent > 85) return 'var(--sysinfo-accent-red, #ff3b30)'
  if (percent > 60) return 'var(--sysinfo-accent-orange, #ff9500)'
  return 'var(--sysinfo-accent-green, #34c759)'
}

/**
 * Maps common Linux distro names to FontAwesome brands or generic icons.
 */
const getDistroIcon = (distroName: string) => {
  const lower = distroName.toLowerCase()
  if (lower.includes('ubuntu')) return 'fa-brands fa-ubuntu'
  if (lower.includes('debian')) return 'fa-brands fa-linux' // No specific fa-debian in standard set sometimes
  if (lower.includes('fedora')) return 'fa-brands fa-fedora'
  if (lower.includes('centos') || lower.includes('red hat')) return 'fa-brands fa-redhat'
  if (lower.includes('apple') || lower.includes('macos')) return 'fa-brands fa-apple'
  if (lower.includes('windows')) return 'fa-brands fa-windows'
  if (lower.includes('docker')) return 'fa-brands fa-docker'
  if (lower.includes('arch')) return 'fa-solid fa-box-open'
  if (lower.includes('raspberry') || lower.includes('raspbian')) return 'fa-brands fa-raspberry-pi'
  return 'fa-solid fa-server'
}

// --- Data Fetching ---

const fetchSystemData = async () => {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error('Network response was not ok')

    const data = await response.json()
    isOffline.value = false

    // Update state with fetched data
    sysData.value = data

    // Set icon based on distro text
    if (data.device?.distro) {
      distroIcon.value = getDistroIcon(data.device.distro)
    }
  } catch (error) {
    isOffline.value = true
    // Optional: Reset stats on error or keep last known
    // sysData.value.cpu.percent = 0;
  }
}

// --- Lifecycle ---

onMounted(() => {
  fetchSystemData()
  timer.value = window.setInterval(fetchSystemData, props.refreshinterval)
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style lang="scss" scoped>
.sysinfo-widget {
  /* Dimensions & Layout */
  width: 320px;
  padding: 20px;
  display: flex;
  flex-direction: column;

  /* Solid Background (Refactored from Glass) */
  background: var(--sysinfo-bg-widget, #ffffff);
  border-radius: var(--sysinfo-radius-lg, 24px);
  border: 1px solid var(--border-color-widget, rgba(0, 0, 0, 0.1));
  box-shadow: var(--sysinfo-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));

  /* Typography */
  color: var(--sysinfo-text-primary, #1c1c1e);
  font-family: var(--font-family, sans-serif);
}

/* Header Section */
.sysinfo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sysinfo-title {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.sysinfo-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--sysinfo-bg-element, #f2f2f7);
  color: var(--sysinfo-text-secondary, #8e8e93);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sysinfo-badge.online {
  color: var(--sysinfo-accent-green, #34c759);
  background: rgba(52, 199, 89, 0.1);
}

/* Device Info Row */
.sysinfo-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 24px;
}

.sysinfo-icon-large {
  width: 48px;
  height: 48px;
  /* Solid background for icon container */
  background: var(--sysinfo-bg-element, #f2f2f7);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--sysinfo-text-primary);
}

.sysinfo-main-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sysinfo-hostname {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sysinfo-distro {
  font-size: 13px;
  color: var(--sysinfo-text-secondary, #8e8e93);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Divider */
.sysinfo-divider {
  height: 1px;
  width: 100%;
  background: var(--border-color-widget, rgba(0, 0, 0, 0.1));
  margin-bottom: 24px;
  opacity: 0.6;
}

/* Stats Grid */
.sysinfo-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.sysinfo-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Circular Charts */
.ring-container {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
}

.circular-chart {
  display: block;
  width: 100%;
  max-height: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--sysinfo-bg-element, #f2f2f7);
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dasharray 0.6s ease;
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ring-val {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: var(--sysinfo-text-primary);
}

.ring-unit {
  font-size: 9px;
  color: var(--sysinfo-text-secondary, #8e8e93);
  margin-top: 1px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--sysinfo-text-secondary, #8e8e93);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
