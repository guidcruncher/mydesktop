<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

// --- State ---
const isOffline = ref(false);
const timer = ref(null);

const sysData = ref({
  device: {
    distro: 'Detecting...',
    hostname: 'Localhost',
    platform: 'Linux'
  },
  cpu: { percent: 0 },
  memory: { percent: 0 },
  storage: {
    percent: 0,
    usedGB: '--',
    totalGB: '--'
  }
});

// --- Simulation State (Fallback) ---
const simCpu = ref(20);
const simRam = ref(40);

// --- API Configuration ---
const API_URL = 'http://localhost:3000/api/sysinfo';

// --- Helpers ---
const getColorForPercent = (percent) => {
  if (percent > 85) return 'var(--sysinfo-accent-red)';
  if (percent > 60) return 'var(--sysinfo-accent-orange)';
  return null; // Will fallback to default via CSS or dynamic binding logic
};

// --- Core Logic ---
const fetchSystemData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    
    // Update State with Real Data
    sysData.value = data;
    isOffline.value = false;

  } catch (error) {
    // Switch to Offline/Simulation Mode
    isOffline.value = true;
    simulateData();
  }
};

const simulateData = () => {
  // Random walk for CPU/RAM simulation
  simCpu.value = Math.max(5, Math.min(95, simCpu.value + Math.floor(Math.random() * 10) - 5));
  simRam.value = Math.max(10, Math.min(90, simRam.value + Math.floor(Math.random() * 6) - 3));

  sysData.value = {
    device: {
      distro: 'Demo Mode',
      hostname: 'No Connection',
      platform: 'Unknown'
    },
    cpu: { percent: simCpu.value },
    memory: { percent: simRam.value },
    storage: {
      percent: 45,
      usedGB: 120,
      totalGB: 256
    }
  };
};

// --- Computed Props for UI Bindings ---
const cpuColor = computed(() => getColorForPercent(sysData.value.cpu.percent) || 'var(--sysinfo-accent-blue)');
const ramColor = computed(() => getColorForPercent(sysData.value.memory.percent) || 'var(--sysinfo-accent-orange)');
const battColor = computed(() => getColorForPercent(sysData.value.storage.percent) || 'var(--sysinfo-accent-blue)');
const statusText = computed(() => isOffline.value ? 'Simulation' : 'Live Feed');
const statusColor = computed(() => isOffline.value ? 'var(--sysinfo-accent-orange)' : 'var(--sysinfo-accent-green)');

// --- Lifecycle ---
onMounted(() => {
  fetchSystemData(); // Initial fetch
  timer.value = setInterval(fetchSystemData, 1500);
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>

<template>
  <div class="-sysinfo-container" :class="{ '-sysinfo-offline': isOffline }">
    
    <!-- CARD 1: DEVICE INFO -->
    <div class="-sysinfo-card -sysinfo-card-wide">
      <div class="-sysinfo-row">
        <div class="-sysinfo-title">
          <svg class="-sysinfo-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          Device
        </div>
        <div class="-sysinfo-chip">{{ sysData.device.distro }}</div>
      </div>
      
      <div class="-sysinfo-device-layout">
        <!-- Left: Hostname -->
        <div>
          <div class="-sysinfo-subtext" style="margin-bottom: 2px;">Hostname</div>
          <div class="-sysinfo-value-large" style="font-size: 24px;">{{ sysData.device.hostname }}</div>
        </div>

        <!-- Right: Details -->
        <div style="text-align:right;">
          <div class="-sysinfo-list-detail">Web Client</div>
          <div class="-sysinfo-list-detail" :style="{ color: statusColor, marginTop: '4px' }">
            {{ statusText }}
          </div>
        </div>
      </div>
    </div>

    <!-- CARD 2: CPU / MEMORY -->
    <div class="-sysinfo-card -sysinfo-card-wide">
      <div class="-sysinfo-title">
        <svg class="-sysinfo-icon" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm6 6h6v6H9V9z"/></svg>
        Current Load <div class="-sysinfo-live-dot"></div>
      </div>
      
      <div class="-sysinfo-load-layout">
        
        <!-- CPU CIRCLE -->
        <div class="-sysinfo-stat-group">
          <div class="-sysinfo-chart-container">
            <svg viewBox="0 0 36 36" class="-sysinfo-circular-chart">
              <path class="-sysinfo-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="-sysinfo-circle" 
                    :style="{ stroke: cpuColor, strokeDasharray: `${sysData.cpu.percent}, 100` }"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <div class="-sysinfo-chart-icon">CPU</div>
          </div>
          <div style="text-align:left;">
            <div class="-sysinfo-value-large" style="font-size:20px;">{{ sysData.cpu.percent }}%</div>
            <div class="-sysinfo-subtext">Processor</div>
          </div>
        </div>

        <!-- Vertical Divider -->
        <div class="-sysinfo-divider"></div>

        <!-- RAM CIRCLE -->
        <div class="-sysinfo-stat-group">
          <div class="-sysinfo-chart-container">
            <svg viewBox="0 0 36 36" class="-sysinfo-circular-chart">
              <path class="-sysinfo-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="-sysinfo-circle" 
                    :style="{ stroke: ramColor, strokeDasharray: `${sysData.memory.percent}, 100` }"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <div class="-sysinfo-chart-icon">RAM</div>
          </div>
          <div style="text-align:left;">
            <div class="-sysinfo-value-large" style="font-size:20px;">{{ sysData.memory.percent }}%</div>
            <div class="-sysinfo-subtext">Memory</div>
          </div>
        </div>

      </div>
    </div>

    <!-- CARD 3: STORAGE DETAILS -->
    <div class="-sysinfo-card -sysinfo-card-wide">
      <div class="-sysinfo-title">Storage</div>
      
      <!-- MAIN DISK (API DATA) -->
      <div class="-sysinfo-list-item">
        <div class="-sysinfo-icon-box" style="background-color: var(--sysinfo-accent-blue);">
          <svg style="width:18px; height:18px; fill:white;" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </div>
        <div class="-sysinfo-list-content">
          <span class="-sysinfo-list-label">Main Disk (/)</span>
          <div class="-sysinfo-progress-container" style="height:4px; margin-top:4px;">
            <div class="-sysinfo-progress-bar" 
                 :style="{ width: `${sysData.storage.percent}%`, backgroundColor: 'var(--sysinfo-accent-blue)' }">
            </div>
          </div>
        </div>
        <div style="text-align:right; margin-left:12px;">
          <span class="-sysinfo-list-label">{{ sysData.storage.percent }}%</span>
          <span class="-sysinfo-list-detail">{{ sysData.storage.usedGB }} / {{ sysData.storage.totalGB }} GB</span>
        </div>
      </div>

      <!-- STATIC (Media) -->
      <div class="-sysinfo-list-item">
        <div class="-sysinfo-icon-box" style="background-color: var(--sysinfo-accent-teal);">
          <svg style="width:18px; height:18px; fill:white;" viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        </div>
        <div class="-sysinfo-list-content">
          <span class="-sysinfo-list-label">System Reserved</span>
          <div class="-sysinfo-progress-container" style="height:4px; margin-top:4px;">
            <div class="-sysinfo-progress-bar" style="width: 15%; background-color: var(--sysinfo-accent-teal);"></div>
          </div>
        </div>
        <div style="text-align:right; margin-left:12px;">
          <span class="-sysinfo-list-label">15%</span>
          <span class="-sysinfo-list-detail">Cached</span>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
/* * SYSTEM VARIABLES & THEME SETUP
 * Prefix: -sysinfo
 * Note: :root in scoped style works but is best practice to define variables at app root level.
 * However, we include them here to ensure the widget works standalone.
 */
:root {
  --sysinfo-bg-widget: rgba(255, 255, 255, 0.65);
  --sysinfo-bg-element: rgba(0, 0, 0, 0.05);
  --sysinfo-text-primary: #1c1c1e;
  --sysinfo-text-secondary: #8e8e93;
  --sysinfo-accent-blue: #007aff;
  --sysinfo-accent-green: #34c759;
  --sysinfo-accent-orange: #ff9500;
  --sysinfo-accent-red: #ff3b30;
  --sysinfo-accent-teal: #30b0c7;
  --sysinfo-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  --sysinfo-radius-lg: 26px;
  --sysinfo-radius-md: 16px;
  --sysinfo-blur: blur(35px);
  --sysinfo-font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --sysinfo-bg-widget: rgba(30, 30, 30, 0.75);
    --sysinfo-bg-element: rgba(255, 255, 255, 0.08);
    --sysinfo-text-primary: #ffffff;
    --sysinfo-text-secondary: #98989d;
    --sysinfo-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }
}

/* * CONTAINER */
.-sysinfo-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto auto auto;
  gap: 12px;
  width: 90%;
  max-width: 380px;
  padding: 20px;
  box-sizing: border-box;
  font-family: var(--sysinfo-font-stack);
  color: var(--sysinfo-text-primary);
  
  background: var(--sysinfo-bg-widget);
  backdrop-filter: var(--sysinfo-blur);
  -webkit-backdrop-filter: var(--sysinfo-blur);
  border-radius: var(--sysinfo-radius-lg);
  box-shadow: var(--sysinfo-shadow);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.-sysinfo-card-wide {
  grid-column: span 2;
}

.-sysinfo-card {
  background: var(--sysinfo-bg-element);
  border-radius: var(--sysinfo-radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
}

/* * TYPOGRAPHY */
.-sysinfo-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sysinfo-text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.-sysinfo-value-large {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.-sysinfo-subtext {
  font-size: 12px;
  font-weight: 500;
  color: var(--sysinfo-text-secondary);
  margin-top: 4px;
}

/* * COMPONENTS */
.-sysinfo-chip {
  background: rgba(128, 128, 128, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--sysinfo-text-primary);
  letter-spacing: 0.02em;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.-sysinfo-progress-container {
  height: 6px;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 10px;
  overflow: hidden;
  margin-top: auto;
}

.-sysinfo-progress-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* * CHARTS */
.-sysinfo-chart-container {
  position: relative;
  width: 50px;
  height: 50px;
}

.-sysinfo-circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 100%;
  transform: rotate(-90deg);
}

.-sysinfo-circle-bg {
  fill: none;
  stroke: rgba(128, 128, 128, 0.15);
  stroke-width: 3.8;
}

.-sysinfo-circle {
  fill: none;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.-sysinfo-chart-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--sysinfo-text-primary);
  font-size: 10px;
  font-weight: 700;
}

/* * LAYOUT HELPERS */
.-sysinfo-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.-sysinfo-device-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.-sysinfo-load-layout {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

.-sysinfo-stat-group {
  text-align: center;
  display: flex;
  gap: 15px;
  align-items: center;
}

.-sysinfo-divider {
  width: 1px;
  height: 35px;
  background: rgba(128,128,128,0.2);
}

.-sysinfo-list-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.-sysinfo-list-item:last-child {
  margin-bottom: 0;
}

.-sysinfo-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.-sysinfo-list-content {
  flex-grow: 1;
}

.-sysinfo-list-label {
  font-size: 12px;
  font-weight: 600;
  display: block;
}

.-sysinfo-list-detail {
  font-size: 11px;
  color: var(--sysinfo-text-secondary);
  display: block;
}

.-sysinfo-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
  opacity: 0.7;
}

/* * ANIMATIONS */
@keyframes -sysinfo-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.-sysinfo-live-dot {
  width: 5px;
  height: 5px;
  background-color: var(--sysinfo-accent-green);
  border-radius: 50%;
  display: inline-block;
  margin-left: auto;
  animation: -sysinfo-pulse 2s infinite;
}

.-sysinfo-offline .-sysinfo-live-dot {
  background-color: var(--sysinfo-accent-red);
  animation: none;
}
</style>

