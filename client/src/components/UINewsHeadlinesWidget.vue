<template>
  <div
    ref="widgetRef"
    class="news-widget-container"
    :class="`news-size-${size}`"
    @click="handleClick"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div v-if="loading" class="news-status-msg">
      <span>Updating...</span>
    </div>
    <div v-if="error" class="news-status-msg news-error">
      <span>Connection Failed</span>
      <button @click.stop="fetchNews" class="news-retry-btn">Retry</button>
    </div>

    <Transition name="news-bg-fade">
      <div
        :key="currentIndex"
        class="news-bg-image"
        :style="{ backgroundImage: currentBgStyle }"
      ></div>
    </Transition>

    <div class="news-overlay"></div>

    <span
      v-if="ripple.show"
      class="news-click-ripple"
      :style="{ top: ripple.y + 'px', left: ripple.x + 'px' }"
      @animationend="ripple.show = false"
    ></span>

    <div class="news-pagination">
      <div
        v-for="(_, index) in articles"
        :key="index"
        class="news-dot"
        :class="{ 'news-active': index === currentIndex }"
      ></div>
    </div>

    <div class="news-content">
      <div class="news-header">
        <div class="news-source-icon">N</div>
        <span class="news-source-name">{{ title }}</span>
      </div>

      <div class="news-headline-wrapper" v-if="currentArticle">
        <div class="news-headline">
          <div v-html="currentArticle.title" />
        </div>
        <div class="news-meta">
          <span class="news-time">{{ currentArticle.timeStr }}</span>
          <span class="news-read-badge">Tap center to open</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'

const API_BASE_URL = `${inject('API_BASE_URL')}`

// --- Props ---
const props = defineProps({
  rss: {
    type: String,
    default: 'http://feeds.bbci.co.uk/news/rss.xml',
  },
  size: {
    type: String,
    default: 'medium', // 'medium' or 'large'
  },
  title: {
    type: String,
    default: 'News',
  },
})

// --- State ---
const articles = ref([])
const currentIndex = ref(0)
const loading = ref(true)
const error = ref(false)
const hovering = ref(false)
const widgetRef = ref(null)
const refreshTimer = ref(null)
let autoRotateInterval = null

// --- Auto Refresh Logic ---
const startAutoRefresh = () => {
  if (refreshTimer.value) clearInterval(refreshTimer.value)
  // Refresh every 1 hour (3600000 ms)
  refreshTimer.value = setInterval(() => {
    fetchNews() // Silent refresh
  }, 3600000)
}

// Ripple State
const ripple = ref({ show: false, x: 0, y: 0 })

// --- Computed ---
const currentArticle = computed(() => {
  return articles.value[currentIndex.value] || null
})

const currentBgStyle = computed(() => {
  if (!currentArticle.value) return 'none'

  if (currentArticle.value.img) {
    return `url('${currentArticle.value.img}')`
  }

  // Gradient Fallback
  const gradients = [
    'linear-gradient(45deg, #8E2DE2 0%, #4A00E0 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(to top, #09203f 0%, #537895 100%)',
    'linear-gradient(to right, #f83600 0%, #f9d423 100%)',
  ]
  const idx = (currentArticle.value.title?.length || 0) % gradients.length
  return gradients[idx]
})

// --- Methods ---

const fetchNews = async () => {
  loading.value = true
  error.value = false

  try {
    const proxyBase = `${API_BASE_URL}/api/proxy/rss`
    const targetUrl = `${proxyBase}?url=${encodeURIComponent(props.rss)}`

    const response = await fetch(targetUrl)
    if (!response.ok) throw new Error(`Status: ${response.status}`)

    const contentType = response.headers.get('content-type')
    let xmlText = ''

    if (contentType && contentType.includes('application/json')) {
      const json = await response.json()
      xmlText = json.content || json.body || json
    } else {
      xmlText = await response.text()
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const items = xmlDoc.querySelectorAll('item')

    if (items.length === 0) throw new Error('No items found')

    articles.value = Array.from(items)
      .slice(0, 10)
      .map((item) => {
        const title = item.querySelector('title')?.textContent
        const link = item.querySelector('link')?.textContent
        const pubDateRaw = item.querySelector('pubDate')?.textContent

        let img = null
        const mediaContent = item.getElementsByTagNameNS('*', 'content')
        const mediaThumbnail = item.getElementsByTagNameNS('*', 'thumbnail')
        const enclosure = item.querySelector('enclosure')

        if (mediaContent.length > 0 && mediaContent[0].getAttribute('url')) {
          img = mediaContent[0].getAttribute('url')
        } else if (mediaThumbnail.length > 0 && mediaThumbnail[0].getAttribute('url')) {
          img = mediaThumbnail[0].getAttribute('url')
        } else if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) {
          img = enclosure.getAttribute('url')
        } else {
          const desc = item.querySelector('description')?.textContent
          if (desc) {
            const match = desc.match(/src="([^"]+)"/)
            if (match) img = match[1]
          }
        }

        let timeStr = ''
        if (pubDateRaw) {
          const date = new Date(pubDateRaw)
          const now = new Date()
          const diffHrs = Math.round((now - date) / 36e5)
          timeStr = diffHrs < 1 ? 'Just now' : `${diffHrs}h ago`
        }

        return { title, link, timeStr, img }
      })

    loading.value = false
    startAutoRotate()
  } catch (err) {
    console.error('RSS Fetch Error:', err)
    error.value = true
    loading.value = false
  }
}

const nextStory = () => {
  if (articles.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % articles.value.length
  resetTimer()
}

const prevStory = () => {
  if (articles.value.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + articles.value.length) % articles.value.length
  resetTimer()
}

const openArticle = () => {
  if (currentArticle.value && currentArticle.value.link) {
    clearInterval(autoRotateInterval)
    window.open(currentArticle.value.link, '_blank')
  }
}

const handleClick = (e) => {
  if (!widgetRef.value || articles.value.length === 0) return

  const rect = widgetRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = rect.width

  ripple.value = {
    show: false,
    x: x,
    y: e.clientY - rect.top,
  }
  requestAnimationFrame(() => {
    ripple.value.show = true
  })

  if (x < width * 0.25) {
    prevStory()
  } else if (x > width * 0.75) {
    nextStory()
  } else {
    openArticle()
  }
}

const startAutoRotate = () => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
  autoRotateInterval = setInterval(() => {
    if (!hovering.value) {
      nextStory()
    }
  }, 6000)
}

const resetTimer = () => {
  clearInterval(autoRotateInterval)
  startAutoRotate()
}

// --- Lifecycle ---
onMounted(() => {
  fetchNews()
  startAutoRefresh()
})

onUnmounted(() => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
  if (refreshTimer.value) clearInterval(refreshTimer.value)
})

watch(
  () => props.rss,
  () => {
    fetchNews()
  },
)
</script>

<style lang="scss" scoped>
.news-widget-container {
  /* Layout Vars */
  --news-radius: 22px;
  /* Use the system font family defined in _component-variables.scss */
  --news-font-stack: var(--weather-font-family);

  position: relative;
  border-radius: var(--surface-radius);
  overflow: hidden;
  font-family: var(--news-font-stack);
  box-shadow: 0 10px 25px -5px var(--news-shadow);
  background: var(--news-bg-fallback);
  color: var(--news-text);
  user-select: none;
  transition:
    transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.2s ease,
    background-color 0.3s;
  cursor: pointer;

  /* Dimensions */
  width: 338px;
  height: 158px;
}

/* Size Variants */
.news-size-medium {
  width: 338px;
  height: 158px;
}

.news-size-large {
  width: 338px;
  height: 354px;
}

.news-widget-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px var(--news-shadow);
}

/* Layers */
.news-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

/* Transition Classes */
.news-bg-fade-enter-active,
.news-bg-fade-leave-active {
  transition: opacity 0.6s ease;
}

.news-bg-fade-enter-from,
.news-bg-fade-leave-to {
  opacity: 0;
}

.news-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
  z-index: 2;
  pointer-events: none;
}

.news-content {
  position: relative;
  z-index: 3;
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

/* Header */
.news-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.news-source-icon {
  width: 18px;
  height: 18px;
  background: var(--news-accent);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.news-source-name {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--news-text-sub);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Headline */
.news-headline-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-bottom: 2px;
}

.news-headline {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--news-text);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  letter-spacing: -0.2px;
}

/* Size adjustments for Large */
.news-size-large .news-headline {
  font-size: 26px;
  -webkit-line-clamp: 5;
  line-height: 1.2;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--news-text-sub);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Read Badge */
.news-read-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.2s ease;
}

.news-widget-container:hover .news-read-badge {
  opacity: 1;
  transform: translateY(0);
}

/* Pagination */
.news-pagination {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 4px;
  z-index: 4;
}

.news-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition:
    background 0.3s,
    transform 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.news-dot.news-active {
  background: #fff;
  transform: scale(1.2);
}

/* Status Messages */
.news-status-msg {
  position: absolute;
  inset: 0;
  background: var(--news-bg-fallback);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--news-status-text);
  font-size: 13px;
  text-align: center;
}

.news-retry-btn {
  margin-top: 10px;
  background: transparent;
  border: 1px solid #666;
  color: var(--news-status-text);
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.news-retry-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Ripple Animation */
.news-click-ripple {
  position: absolute;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
  animation: news-ripple 0.4s linear forwards;
}

@keyframes news-ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 350px;
    height: 350px;
    opacity: 0;
  }
}
</style>
