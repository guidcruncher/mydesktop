<template>
  <div class="stocks-widget-wrapper">
    <div class="stocks-widget surface">
      <div class="stocks-header">
        <div class="stocks-title-group">
          <span class="stocks-label-sm">{{ currentDate }}</span>
          <div class="stocks-headline-wrapper">
            <h1 class="stocks-headline">Market</h1>
            <span class="stocks-loader" :class="{ active: isLoading }"></span>
          </div>
        </div>
      </div>

      <div class="stocks-scroll-area">
        <div
          v-for="(item, index) in filteredStocks"
          :key="item.symbol"
          class="stocks-item stocks-animate-entry"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div :class="['stocks-icon', item.color]">
            {{ getIconLabel(item) }}
          </div>

          <div class="stocks-info">
            <div class="stocks-symbol">{{ item.displayId }}</div>
            <div class="stocks-name">{{ item.name }}</div>
          </div>

          <div class="stocks-chart-container">
            <svg
              class="stocks-sparkline"
              :class="item.change >= 0 ? 'stocks-stroke-up' : 'stocks-stroke-down'"
              viewBox="0 0 80 30"
              preserveAspectRatio="none"
            >
              <path :d="generateSparkline(item.change)" vector-effect="non-scaling-stroke" />
            </svg>
          </div>

          <div class="stocks-price-group">
            <div class="stocks-current-price">
              {{ formatPrice(item.price, item.type) }}
            </div>
            <div
              class="stocks-change-badge"
              :class="item.change >= 0 ? 'stocks-trend-up' : 'stocks-trend-down'"
            >
              {{ formatChange(item.change) }}
            </div>
          </div>
        </div>
      </div>

      <div class="stocks-footer">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="stocks-filter-btn"
          :class="{ 'stocks-active': currentFilter === filter.value }"
          @click="currentFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// --- Props Definition ---
const props = defineProps({
  apiKey: {
    type: String,
    default: 'd52l2lpr01qggm5se05gd52l2lpr01qggm5se060',
  },
  updateInterval: {
    type: Number,
    default: 15000, // 15 seconds
  },
  symbols: {
    type: Array,
    default: () => [
      'AAPL',
      'OANDA:EUR_USD',
      'BINANCE:BTCUSDT',
      'NVDA',
      'BINANCE:ETHUSDT',
      'OANDA:GBP_USD',
      'TSLA',
      'OANDA:USD_JPY',
      'AMZN',
    ],
  },
})

// --- State ---
const currentFilter = ref('all')
const isLoading = ref(false)
const stocksData = ref([])
let intervalId = null

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Forex', value: 'forex' },
  { label: 'Stocks', value: 'stock' },
]

// --- Initialization Logic ---
function parseSymbol(rawSymbol) {
  let type = 'stock'
  let displayId = rawSymbol
  let name = rawSymbol
  let color = 'stocks-bg-gray'

  if (rawSymbol.includes('BINANCE:') || rawSymbol.includes('COINBASE:')) {
    type = 'crypto'
    const clean = rawSymbol.split(':')[1]
    displayId = clean.replace('USDT', '').replace('USD', '')
    name = `${displayId}/USD`
    if (displayId === 'BTC') color = 'stocks-bg-orange'
    else if (displayId === 'ETH') color = 'stocks-bg-purple'
    else color = 'stocks-bg-black'
  } else if (rawSymbol.includes('OANDA:') || rawSymbol.includes('FX:')) {
    type = 'forex'
    const clean = rawSymbol.split(':')[1]
    displayId = clean.replace('_', '/')
    name = displayId
    color = 'stocks-bg-blue'
  } else {
    type = 'stock'
    displayId = rawSymbol
    name = rawSymbol
    color = 'stocks-bg-black'
  }

  return {
    symbol: rawSymbol,
    displayId,
    name,
    type,
    color,
    price: 0,
    change: 0,
  }
}

function initStocks() {
  stocksData.value = props.symbols.map((s) => parseSymbol(s))
}

// --- Computed ---
const filteredStocks = computed(() => {
  if (currentFilter.value === 'all') return stocksData.value
  return stocksData.value.filter((item) => item.type === currentFilter.value)
})

const currentDate = computed(() => {
  const options = { month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('en-US', options).toUpperCase()
})

// --- Methods ---
function getIconLabel(item) {
  if (item.type === 'crypto' || item.type === 'forex') {
    return item.displayId.substring(0, 1)
  }
  return item.name.substring(0, 1)
}

function formatPrice(price, type) {
  if (!price) return '---'
  if (type === 'forex') return price.toFixed(4)
  if (price > 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return price.toFixed(2)
}

function formatChange(change) {
  if (change === undefined || change === null) return '0.00%'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

function generateSparkline(trendPercent) {
  const width = 80
  const height = 30
  let points = []
  let y = height / 2
  const bias = trendPercent > 0 ? -1.5 : 1.5

  for (let i = 0; i < 10; i++) {
    const x = (i / 9) * width
    const volatility = 8
    const randomMove = (Math.random() - 0.5) * volatility
    y += randomMove + (Math.abs(trendPercent) > 0.1 ? bias : 0)
    y = Math.max(2, Math.min(height - 2, y))
    points.push(`${x},${y}`)
  }
  return points.map((val, idx) => (idx === 0 ? 'M' : 'L') + val).join(' ')
}

// --- API Calls ---
async function fetchProfiles() {
  if (!props.apiKey) return
  const stockItems = stocksData.value.filter((item) => item.type === 'stock')
  for (const item of stockItems) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${props.apiKey}`,
      )
      if (!response.ok) continue
      const data = await response.json()
      if (data && data.name) {
        item.name = data.name
      }
    } catch (e) {
      // Silent fail
    }
  }
}

async function fetchQuotes() {
  if (!props.apiKey) {
    console.warn('MarketWidget: No API Key provided')
    return
  }
  isLoading.value = true

  const promises = stocksData.value.map(async (item) => {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${props.apiKey}`,
      )
      if (!response.ok) return
      const data = await response.json()
      if (data.c) {
        item.price = data.c
        item.change = data.dp
      }
    } catch (error) {
      console.warn(`Failed to fetch quote for ${item.symbol}`, error)
    }
  })

  await Promise.all(promises)
  isLoading.value = false
}

function startTimer() {
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(fetchQuotes, props.updateInterval)
}

onMounted(async () => {
  initStocks()
  await fetchQuotes()
  fetchProfiles()
  startTimer()
})

watch(() => props.updateInterval, startTimer)
watch(
  () => props.symbols,
  () => {
    initStocks()
    fetchQuotes()
    fetchProfiles()
  },
  { deep: true },
)

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style lang="scss">
:root {
  --stocks-color-green: #30d158;
  --stocks-color-red: #ff453a;
  --stocks-color-blue: #0a84ff;
  --stocks-color-orange: #ff9f0a;
  --stocks-color-purple: #bf5af2;
  --stocks-color-gray: #8e8e93;
  --stocks-radius-lg: 32px;
  --stocks-radius-md: 16px;
}
</style>

<style lang="scss" scoped>
.stocks-widget-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.stocks-widget {
  width: 380px;
  height: 600px;

  /* Solid Background */

  border-radius: var(--stocks-radius-lg);
  border: 1px solid var(--stocks-border-subtle);
  box-shadow: var(--stocks-shadow);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

/* Header */
.stocks-header {
  padding: 24px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  z-index: 10;
}

.stocks-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stocks-label-sm {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--stocks-text-secondary);
}

.stocks-headline-wrapper {
  display: flex;
  align-items: center;
}

.stocks-headline {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0;
  line-height: 1;
  color: var(--text-color);
}

.stocks-loader {
  width: 16px;
  height: 16px;
  border: 2px solid var(--stocks-text-secondary);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: stocks-rotation 1s linear infinite;
  margin-left: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.stocks-loader.active {
  opacity: 1;
}

/* Scrollable Content */
.stocks-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px 16px; /* Added bottom padding to account for footer */
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.stocks-scroll-area::-webkit-scrollbar {
  display: none;
}

/* Stock Item */
.stocks-item {
  display: grid;
  grid-template-columns: 48px 1fr 80px 75px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: var(--stocks-bg-item);
  border-radius: var(--stocks-radius-md);
  transition:
    transform 0.2s,
    background 0.2s;
  cursor: default;
}

.stocks-item:hover {
  background: var(--stocks-bg-item-active);
}

/* Icon */
.stocks-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
  position: relative;
  overflow: hidden;
}

.stocks-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0));
}

/* Info */
.stocks-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stocks-symbol {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.stocks-name {
  font-size: 12px;
  color: var(--stocks-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

/* Chart */
.stocks-chart-container {
  height: 30px;
  display: flex;
  align-items: center;
}

.stocks-sparkline {
  width: 100%;
  height: 100%;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
}

/* Prices */
.stocks-price-group {
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stocks-current-price {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-color);
}

.stocks-change-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
  transition: background 0.3s;
}

/* Utility Colors */
.stocks-bg-blue {
  background: var(--stocks-color-blue);
}
.stocks-bg-purple {
  background: var(--stocks-color-purple);
}
.stocks-bg-orange {
  background: var(--stocks-color-orange);
}
.stocks-bg-gray {
  background: var(--stocks-color-gray);
}
.stocks-bg-black {
  background: #1c1c1e;
}

.stocks-trend-up {
  background: rgba(48, 209, 88, 0.15);
  color: var(--stocks-color-green);
}

.stocks-trend-down {
  background: rgba(255, 69, 58, 0.15);
  color: var(--stocks-color-red);
}

.stocks-stroke-up {
  stroke: var(--stocks-color-green);
}
.stocks-stroke-down {
  stroke: var(--stocks-color-red);
}

/* Footer - Solidified */
.stocks-footer {
  padding: 16px;
  /* Solid background matched to widget */
  background: var(--stocks-bg-widget);
  border-top: 1px solid var(--stocks-border-subtle);
  display: flex;
  justify-content: center;
  gap: 12px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
}

.stocks-filter-btn {
  background: var(--stocks-bg-pill);
  color: var(--stocks-text-secondary);
  border: none;
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.stocks-filter-btn:hover {
  transform: scale(1.05);
}

.stocks-filter-btn.stocks-active {
  background: var(--stocks-bg-pill-active);
  color: var(--stocks-text-inverse);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes stocks-rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes stocks-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stocks-animate-entry {
  animation: stocks-fade-in 0.4s ease forwards;
}
</style>
