<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  // The list of images to display.
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

// State
const isSidebarOpen = ref(true)
const activeImage = ref(null)
const lightboxVisible = ref(false)

// Methods
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const openLightbox = (image) => {
  activeImage.value = image
  lightboxVisible.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxVisible.value = false
  setTimeout(() => {
    activeImage.value = null
    document.body.style.overflow = ''
  }, 300)
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && lightboxVisible.value) {
    closeLightbox()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="imgbrws-ios-browser">
    <!-- Sidebar Area -->
    <aside class="imgbrws-sidebar" :class="{ 'imgbrws-closed': !isSidebarOpen }">
      <div class="imgbrws-sidebar-content">
        <slot name="sidebar">
          <!-- Fallback Sidebar Content -->
          <div class="imgbrws-default-sidebar-msg">
            <h2 class="imgbrws-sidebar-title">Library</h2>
            <div class="imgbrws-placeholder-nav">
              No sidebar content provided.<br />
              Use &lt;template #sidebar&gt;
            </div>
          </div>
        </slot>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="imgbrws-main-content">
      <!-- Top Bar -->
      <header class="imgbrws-top-bar">
        <div class="imgbrws-top-left">
          <button
            class="imgbrws-icon-btn imgbrws-sidebar-toggle"
            @click="toggleSidebar"
            aria-label="Toggle Sidebar"
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
          <span class="imgbrws-view-title">Photos</span>
        </div>
        <div class="imgbrws-top-right">
          <button class="imgbrws-text-btn">Select</button>
        </div>
      </header>

      <!-- Photo Grid -->
      <div class="imgbrws-scroll-container">
        <div class="imgbrws-photo-grid" v-if="modelValue.length > 0">
          <div
            v-for="image in modelValue"
            :key="image.id"
            class="imgbrws-grid-item"
            @click="openLightbox(image)"
          >
            <img loading="lazy" :src="image.url" :alt="image.title || 'Photo'" />
          </div>
        </div>

        <div v-else class="imgbrws-empty-state">No Photos</div>
      </div>
    </main>

    <!-- Lightbox Overlay -->
    <Transition name="imgbrws-fade">
      <div v-if="lightboxVisible" class="imgbrws-lightbox" @click.self="closeLightbox">
        <button class="imgbrws-lightbox-close" @click="closeLightbox">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
        </button>

        <div class="imgbrws-lightbox-content">
          <img
            :src="activeImage?.fullUrl || activeImage?.url"
            class="imgbrws-lightbox-img"
            alt="Fullscreen view"
          />

          <div class="imgbrws-lightbox-details" v-if="activeImage">
            <h3>{{ activeImage.title || 'Untitled' }}</h3>
            <p v-if="activeImage.date">{{ activeImage.date }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Theme Variables Definition with Prefix */
.imgbrws-ios-browser {
  /* Layout & Fonts */
  font-family: var(--font-family);
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  position: relative;
  background-color: var(--imgbrws-app-bg);
  color: var(--imgbrws-text-primary);
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* --- Sidebar --- */
.imgbrws-sidebar {
  width: 280px;
  background-color: var(--imgbrws-sidebar-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-right: 1px solid var(--imgbrws-sidebar-border);
  flex-shrink: 0;
  transition:
    transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
    margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.imgbrws-sidebar.imgbrws-closed {
  margin-left: -280px;
}

.imgbrws-sidebar-content {
  padding: 20px 10px;
  height: 100%;
  overflow-y: auto;
}

.imgbrws-sidebar-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-left: 12px;
  color: var(--imgbrws-text-secondary);
}

.imgbrws-default-sidebar-msg {
  padding: 20px;
}

.imgbrws-placeholder-nav {
  padding: 20px;
  color: var(--imgbrws-text-secondary);
  font-size: 14px;
  text-align: center;
  border: 1px dashed var(--imgbrws-separator);
  border-radius: 12px;
}

/* --- Main Content --- */
.imgbrws-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--imgbrws-content-bg);
  position: relative;
  min-width: 0;
}

.imgbrws-top-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--imgbrws-top-bar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 5;
  border-bottom: 1px solid var(--imgbrws-top-bar-border);
  transition: background-color 0.3s;
}

.imgbrws-top-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.imgbrws-view-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--imgbrws-text-primary);
}

.imgbrws-icon-btn {
  background: none;
  border: none;
  color: var(--imgbrws-accent-blue);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imgbrws-icon-btn svg {
  fill: currentColor;
  width: 24px;
  height: 24px;
}

.imgbrws-text-btn {
  background: none;
  border: none;
  color: var(--imgbrws-accent-blue);
  font-size: 17px;
  cursor: pointer;
  font-weight: 400;
}

/* --- Grid --- */
.imgbrws-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 62px 2px 20px 2px;
  scrollbar-width: none;
}

.imgbrws-scroll-container::-webkit-scrollbar {
  display: none;
}

.imgbrws-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 2px;
}

.imgbrws-grid-item {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: var(--imgbrws-grid-item-bg);
  cursor: pointer;
}

.imgbrws-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  display: block;
}

.imgbrws-grid-item:hover img {
  filter: brightness(1.05);
}

.imgbrws-grid-item:active img {
  transform: scale(0.96);
}

.imgbrws-empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--imgbrws-text-secondary);
  font-size: 18px;
}

/* --- Lightbox --- */
.imgbrws-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--imgbrws-lightbox-bg);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imgbrws-lightbox-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.imgbrws-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.imgbrws-lightbox-close {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(80, 80, 80, 0.5);
  backdrop-filter: blur(10px);
  border: none;
  color: white; /* Always white on dark lightbox overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
}

.imgbrws-lightbox-close svg {
  fill: currentColor;
  width: 24px;
  height: 24px;
}

.imgbrws-lightbox-details {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-align: center;
  color: var(--imgbrws-lightbox-text);
}

.imgbrws-lightbox-details h3 {
  margin: 0 0 4px 0;
  font-size: 17px;
  font-weight: 600;
}

.imgbrws-lightbox-details p {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}

/* --- Transitions --- */
.imgbrws-fade-enter-active,
.imgbrws-fade-leave-active {
  transition: opacity 0.3s ease;
}

.imgbrws-fade-enter-from,
.imgbrws-fade-leave-to {
  opacity: 0;
}

.imgbrws-fade-enter-active .imgbrws-lightbox-img {
  animation: imgbrws-zoomIn 0.3s cubic-bezier(0.2, 0, 0.2, 1);
}

@keyframes imgbrws-zoomIn {
  from {
    transform: scale(0.9);
  }
  to {
    transform: scale(1);
  }
}

/* --- Mobile Breakpoints --- */
@media (max-width: 768px) {
  .imgbrws-sidebar {
    position: absolute;
    height: 100%;
    margin-left: 0;
    transform: translateX(0);
    width: 85%;
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
  }

  .imgbrws-sidebar.imgbrws-closed {
    transform: translateX(-100%);
    margin-left: 0;
  }

  .imgbrws-photo-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
  }
}
</style>
