<template>
  <UIWidgetView width="330px">
    <template #title>
      <div class="sysinfo-header">
        <div v-if="sysData.device.container">
          <img
            style="width: 20px; height: 20px"
            src="https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/docker.png"
          />
        </div>
        <div v-if="sysData.device.container" class="sysinfo-title">&nbsp;Container Status</div>
        <div v-else class="sysinfo-title">&nbsp;System Status</div>
      </div>
    </template>
    <div class="sysinfo-row">
      <div class="sysinfo-icon-large">
        <img v-if="distroIcon" style="width: 40px; height: 40px" :src="distroIcon" />
        <i v-else class="fa-solid fa-server"></i>
      </div>
      <div class="sysinfo-main-text">
        <div class="sysinfo-hostname">{{ sysData.device.hostname }}</div>
        <div class="sysinfo-distro">{{ sysData.device.distro }}</div>
      </div>
    </div>

    <div class="sysinfo-row">
      <div class="sysinfo-icon-large" v-html="sysData.device.archLogo"></div>
      <div class="sysinfo-main-text">
        <div class="sysinfo-hostname">{{ sysData.device.arch }}</div>
        <div class="sysinfo-distro">{{ sysData.device.cpu }}</div>
      </div>
    </div>

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
  </UIWidgetView>
</template>

<script lang="ts" setup>
import { inject, ref, onMounted, onUnmounted } from 'vue'

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
const getColorForPercent = (percent: number) => {
  if (percent > 85) return 'var(--sys-danger)'
  if (percent > 60) return 'var(--sys-warning)'
  return 'var(--sys-success)'
}

// --- Data Fetching ---
const fetchSystemData = async () => {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error('Network response was not ok')
    const data = await response.json()
    isOffline.value = false
    sysData.value = data
    if (data.device?.icon) {
      distroIcon.value = data.device?.icon
    }
  } catch (error) {
    isOffline.value = true
  }
}

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
/* Inherits .surface styles from UIWidgetView wrapper typically,
   but we style internal elements to match the system. */

.sysinfo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-family);
  color: var(--text-color);
}

.sysinfo-title {
  font-weight: 700;
  font-size: 1rem;
}

.sysinfo-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--btn-radius);
  background: rgba(var(--surface-rgb), 0.1);
  color: var(--text-secondary);
  border: var(--surface-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sysinfo-badge.online {
  color: #fff;
  background: var(--sys-success);
  border-color: var(--sys-success);
}

/* Device Info Row */
.sysinfo-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.sysinfo-icon-large {
  width: 48px;
  height: 48px;
  background: rgba(var(--surface-rgb), 0.1);
  border: var(--surface-border);
  border-radius: var(--icon-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--sys-primary);
}

.sysinfo-main-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-family);
}

.sysinfo-hostname {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color);
}

.sysinfo-distro {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Stats Grid */
.sysinfo-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
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
  stroke: rgba(var(--surface-rgb), 0.1);
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
  font-family: var(--font-family);
}

.ring-val {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-color);
}

.ring-unit {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: 1px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: var(--font-family);
}
</style>
