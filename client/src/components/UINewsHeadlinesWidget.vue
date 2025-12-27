<template>
  <UIWidgetView
    :title="title"
    class="news-widget-fixed"
    :class="[`news-size-${size}`, { 'has-image': !!currentBgStyle }]"
    :style="{ '--news-bg-current': currentBgStyle }"
  >
    <template #header-suffix>
      <div class="news-pagination">
        <div
          v-for="(_, index) in articles"
          :key="index"
          class="news-dot"
          :class="{ 'news-active': index === currentIndex }"
        ></div>
      </div>
    </template>

    <div
      ref="widgetRef"
      class="news-inner-content"
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

      <span
        v-if="ripple.show"
        class="news-click-ripple"
        :style="{ top: ripple.y + 'px', left: ripple.x + 'px' }"
        @animationend="ripple.show = false"
      ></span>

      <div class="news-content-layout">
        <div class="news-headline-wrapper" v-if="currentArticle">
          <div class="news-headline">
            <div v-html="currentArticle.title" />
          </div>
          <div class="news-meta">
            <span class="news-time">{{ currentArticle.timeStr }}</span>
            <span class="news-read-badge">Tap to open</span>
          </div>
        </div>
      </div>
    </div>
  </UIWidgetView>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'

const API_BASE_URL = `${inject('API_BASE_URL')}`

const props = defineProps({
  rss: { type: String, default: 'http://feeds.bbci.co.uk/news/rss.xml' },
  size: { type: String, default: 'medium' }, // 'medium' (158px) or 'large' (354px)
  title: { type: String, default: 'News' },
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
const ripple = ref({ show: false, x: 0, y: 0 })

// --- Computed ---
const currentArticle = computed(() => articles.value[currentIndex.value] || null)

const currentBgStyle = computed(() => {
  // Always return a value (fallback gradient) if no article or image
  if (!currentArticle.value || !currentArticle.value.img) {
    // Default gradients based on title length (pseudo-random)
    const gradients = [
      'linear-gradient(45deg, #8E2DE2 0%, #4A00E0 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(to top, #09203f 0%, #537895 100%)',
      'linear-gradient(to right, #f83600 0%, #f9d423 100%)',
    ]
    const idx = (currentArticle.value?.title?.length || 0) % gradients.length
    return gradients[idx]
  }
  
  return `url('${currentArticle.value.img}')`
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

    articles.value = Array.from(items).slice(0, 10).map((item) => {
      const title = item.querySelector('title')?.textContent
      const link = item.querySelector('link')?.textContent
      const pubDateRaw = item.querySelector('pubDate')?.textContent
      
      let img = null
      // Robust Image Extraction
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
        // Fallback: Try regex on description
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
  if (currentArticle.value?.link) {
    clearInterval(autoRotateInterval)
    window.open(currentArticle.value.link, '_blank')
  }
}

const handleClick = (e) => {
  if (!widgetRef.value || articles.value.length === 0) return
  const rect = widgetRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = rect.width
  ripple.value = { show: false, x: x, y: e.clientY - rect.top }
  requestAnimationFrame(() => { ripple.value.show = true })

  if (x < width * 0.25) prevStory()
  else if (x > width * 0.75) nextStory()
  else openArticle()
}

const startAutoRotate = () => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
  autoRotateInterval = setInterval(() => {
    if (!hovering.value) nextStory()
  }, 6000)
}

const resetTimer = () => {
  clearInterval(autoRotateInterval)
  startAutoRotate()
}

const startAutoRefresh = () => {
  if (refreshTimer.value) clearInterval(refreshTimer.value)
  refreshTimer.value = setInterval(() => fetchNews(), 3600000)
}

onMounted(() => {
  fetchNews()
  startAutoRefresh()
})

onUnmounted(() => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
  if (refreshTimer.value) clearInterval(refreshTimer.value)
})

watch(() => props.rss, fetchNews)
</script>

<style lang="scss" scoped>
/* FIXED WIDTHS 
*/
.news-widget-fixed {
  width: 338px;
  position: relative;
  user-select: none;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  /* IMPORTANT: Override Generic Wrapper Padding */
  padding: 0 !important; 
  overflow: hidden;
  background-color: #333; /* Dark background fallback */
  color: white; /* Default text color */
}

.news-widget-fixed:hover {
  transform: translateY(-2px);
}

.news-size-medium {
  height: 158px;
}

.news-size-large {
  height: 354px;
}

/* FULL COVER IMAGE LAYERS
  These pseudo-elements attach to the Root Wrapper (.news-widget-fixed)
*/
.news-widget-fixed::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--news-bg-current);
  background-size: cover;
  background-position: center;
  transition: background-image 0.6s ease;
  z-index: 0; /* Behind content */
}

.news-widget-fixed::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.9) 100%
  );
  z-index: 1; /* Above image, below content */
  pointer-events: none;
}

/* DEEP SELECTORS for UIWidgetView Internals 
  We must elevate these above the ::before/::after layers
*/

/* 1. Elevate Header */
.news-widget-fixed :deep(.ui-widget-header) {
  position: relative;
  z-index: 10;
  padding: 16px 16px 0 16px; /* Re-apply padding manually */
  width: auto;
}

/* 2. Force Header Title White */
.news-widget-fixed :deep(.ui-widget-title) {
  color: white !important;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  opacity: 1;
}

/* 3. Elevate Body & Fix Padding */
.news-widget-fixed :deep(.ui-widget-body) {
  position: relative;
  z-index: 10;
  padding: 0 16px 16px 16px; /* Re-apply padding manually */
}

/* INTERNAL LAYOUT 
*/
.news-inner-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.news-content-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.news-headline-wrapper {
  display: flex; 
  flex-direction: column; 
  gap: 4px;
}

.news-headline {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}

.news-size-large .news-headline {
  font-size: 24px;
  -webkit-line-clamp: 5;
}

.news-meta {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  font-size: 11px; 
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  margin-top: 4px;
}

/* Pagination Dots */
.news-pagination {
  display: flex; 
  gap: 4px;
}

.news-dot {
  width: 4px; 
  height: 4px; 
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.news-dot.news-active {
  background: #fff;
  transform: scale(1.4);
}

/* Status Messages */
.news-status-msg {
  position: absolute; 
  inset: 0;
  background: #333; 
  z-index: 20;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center;
  color: #fff; 
  font-size: 13px;
}

.news-retry-btn {
  margin-top: 10px; 
  background: transparent; 
  border: 1px solid #999;
  color: #fff; 
  padding: 4px 12px; 
  border-radius: 12px; 
  cursor: pointer;
}

/* Ripple */
.news-click-ripple {
  position: absolute; 
  width: 0; 
  height: 0;
  background: rgba(255,255,255,0.2);
  border-radius: 50%; 
  transform: translate(-50%, -50%);
  pointer-events: none; 
  z-index: 15;
  animation: news-ripple 0.4s linear forwards;
}

@keyframes news-ripple {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 350px; height: 350px; opacity: 0; }
}
</style>
