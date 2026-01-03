<template>
  <UIWidgetView class="rail-widget" width="330px">
    <template #title>
      <span>{{ locationName }} ({{ stationCode }})</span>
    </template>

    <div class="list-header">
      <div>Time</div>
      <div>{{ mode === 'dep' ? 'Destination' : 'Origin' }}</div>
      <div class="text-center">Plat</div>
      <div class="text-right">Sta</div>
    </div>

    <div v-if="loading && data.length === 0" class="state-msg">
      <div class="spinner"></div>
      <span>Loading services...</span>
    </div>

    <div v-else-if="error" class="state-msg">
      <i data-lucide="alert-triangle" class="icon-danger"></i>
      <div class="err-msg">
        <div>{{ error }}</div>
        <div class="err-sub">Check configuration</div>
      </div>
    </div>

    <div v-else-if="data.length === 0" class="state-msg">
      <i data-lucide="ghost" class="icon-faded"></i>
      <span>No services found</span>
    </div>

    <div v-else class="service-list">
      <div
        v-for="(row, i) in data"
        :key="row.uid"
        class="list-item"
        :class="{
          'first-row': i === 0 && !row.isPassing,
          passing: row.isPassing,
        }"
      >
        <div class="font-bold">{{ row.time }}</div>
        <div class="truncate">{{ row.loc }}</div>
        <div class="text-center font-bold">
          <span v-if="row.isPassing"><i>pass</i></span>
          <span v-else>{{ row.plat }}</span>
        </div>
        <div class="text-right">
          <span :class="getStatusClasses(row.est)">
            <i v-if="row.est == 'On time'" class="fa-solid fa-circle-check"></i>
            <i v-if="row.est == 'Cancelled'" class="fa-solid fa-circle-xmark"></i>
            <i v-if="row.est == 'Pass'" class="fa-solid fa-circle-minus"></i>
          </span>
        </div>
      </div>
    </div>
  </UIWidgetView>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject, nextTick } from 'vue'
import { useRailServices } from '../composables/useRailServices'

// --- Props ---
const props = defineProps({
  refreshInterval: { type: [String, Number], default: 30 },
  stationCode: { type: String, default: 'PAD' },
  locationName: { type: String, default: 'London Paddington' },
  apiUser: { type: String, required: true },
  apiPass: { type: String, required: true },
  retro: { type: Boolean, default: false },
})

// --- Logic ---
const mode = ref('dep') // 'dep' or 'arr'
const showPassing = ref(true)
const proxyUrl = `${inject('API_BASE_URL', '')}/api/rtt/` // Inject global proxy if needed

// Initialize Composable
const { data, loading, error, lastUpdated, fetchData } = useRailServices({
  stationCode: () => props.stationCode,
  mode: mode,
  showPassing: showPassing,
  apiUser: () => props.apiUser,
  apiPass: () => props.apiPass,
  proxyUrl: proxyUrl,
})

// --- Computed ---
const formattedTime = computed(() => lastUpdated.value.toLocaleTimeString())
const refreshMs = computed(() => parseInt(props.refreshInterval) * 1000)

// --- Timers & Icons ---
let fetchInterval = null

const refreshIcons = () => {
  if (window.lucide) nextTick(() => window.lucide.createIcons())
}

const getStatusClasses = (est) => {
  if (props.retro) return []
  const classes = ['status-badge']
  if (est === 'On time') classes.push('status-ok')
  else if (est === 'Cancelled') classes.push('status-err')
  else if (est === 'Pass') classes.push('status-warn')
  else classes.push('status-warn')
  return classes
}

onMounted(() => {
  fetchData().then(refreshIcons)
  fetchInterval = setInterval(fetchData, refreshMs.value)
})

onUnmounted(() => {
  clearInterval(fetchInterval)
})
</script>

<style scoped>
/* Local utilities */
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-bold {
  font-weight: 700;
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-list {
  height: 150px;
  overflow: auto;
}

/* Grid Layout */
.list-header,
.list-item {
  display: grid;
  grid-template-columns: 50px 1fr 20px 60px;
  padding: 12px 20px;
  align-items: center;
}

.list-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-tertiary);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  font-size: 0.95rem;
}

.list-item.first-row {
  background: rgba(99, 102, 241, 0.05); /* uses primary var fallback */
}

/* Status Badges */
.status-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.status-ok {
  color: var(--sys-success);
}
.status-warn {
  color: var(--sys-warning);
}
.status-err {
  color: var(--sys-danger);
}

/* Retro Mode Overrides */
.retro-mode .ui-widget-content {
  background: #000;
  color: #fca311;
  font-family: 'Share Tech Mono', monospace;
}
.retro-mode .status-ok,
.retro-mode .status-warn,
.retro-mode .status-err {
  background: none;
  color: inherit;
}

/* Icons */
.icon-danger {
  width: 32px;
  height: 32px;
  color: var(--sys-danger);
}
.icon-faded {
  width: 32px;
  height: 32px;
  opacity: 0.5;
}

/* Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--sys-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
