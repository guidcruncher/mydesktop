<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// --- PROPS & EMITS ---
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  dataUrlField: {
    type: String,
    default: 'url',
  },
  dataIdField: {
    type: String,
    default: 'id',
  },
  dataTitleField: {
    type: String,
    default: 'title',
  },
})

const emit = defineEmits(['select', 'search'])

// --- STATE ---
const activeFramework = ref('framework-vision')
const isDarkMode = ref(false)
const searchQuery = ref('')
const showModal = ref(false)
const selectedImage = ref(null)

const knownFrameworks = [
  'framework-vision',
  'framework-fluent',
  'framework-gnome',
  'framework-kde',
  'framework-android',
  'framework-nextstep',
  'framework-riscos',
]

// --- COMPUTED ---
const filteredImages = computed(() => {
  return props.modelValue
})

// The root classes drive the entire style engine via CSS variables
const containerClasses = computed(() => {
  return ['image-browser-host', activeFramework.value, { 'dark-mode': isDarkMode.value }]
})

// --- METHODS ---

// Helper to safely access dynamic fields
const getImgId = (img) => img[props.dataIdField]
const getImgUrl = (img) => img[props.dataUrlField]
const getImgTitle = (img) => img[props.dataTitleField]

// Search
function performSearch() {
  emit('search', searchQuery.value)
}

// --- SYNC LOGIC ---

// Updates local state based on document.body classes
const updateStateFromBody = () => {
  const bodyClasses = document.body.classList

  // Sync Dark Mode
  isDarkMode.value = bodyClasses.contains('dark-mode')

  // Sync Framework
  const foundFw = knownFrameworks.find((fw) => bodyClasses.contains(fw))
  if (foundFw) {
    activeFramework.value = foundFw
  }
}

let bodyObserver = null

onMounted(() => {
  // 1. Initial Sync
  updateStateFromBody()

  // 2. Setup Observer to watch for class changes on body
  bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateStateFromBody()
      }
    })
  })

  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onUnmounted(() => {
  if (bodyObserver) bodyObserver.disconnect()
})

// Modal Actions
function openModal(img) {
  selectedImage.value = img
  showModal.value = true
  emit('select', img)
}

function closeModal(e) {
  // If e is present, checks if click was on overlay
  if (e && e.target !== e.currentTarget) return
  showModal.value = false
  setTimeout(() => {
    selectedImage.value = null
  }, 300) // Wait for animation
}
</script>

<template>
  <div :class="containerClasses">
    <div class="main-container">
      <!-- MAIN GALLERY -->
      <main class="gallery-area">
        <div class="toolbar">
          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search photos..."
              @keyup.enter="performSearch"
            />
            <button class="btn-search-action" @click="performSearch" title="Search">
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div class="filter-controls"></div>
        </div>

        <div class="image-grid">
          <div
            v-for="img in filteredImages"
            :key="getImgId(img)"
            class="img-card"
            @click="openModal(img)"
          >
            <div class="img-thumb">
              <img :src="getImgUrl(img)" loading="lazy" :alt="getImgTitle(img)" />
            </div>
            <div class="img-meta">
              <div class="img-title">{{ getImgTitle(img) }}</div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <!-- 
        The modal wrapper inherits the same framework classes as the main container 
        to ensure styling consistency (CSS variables) carries over to the teleported content.
      -->
      <div class="image-browser-host" :class="[activeFramework, { 'dark-mode': isDarkMode }]">
        <div class="modal-overlay" :class="{ active: showModal }" @click="closeModal">
          <div class="modal-content" @click.stop v-if="selectedImage">
            <div class="modal-header">
              <span class="modal-title">{{ getImgTitle(selectedImage) }}</span>
              <button class="close-modal" @click="closeModal">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="modal-image-container">
                <img :src="getImgUrl(selectedImage)" alt="Preview" />
              </div>
              <div class="modal-details">
                <div class="detail-row"></div>
                <div class="detail-row">
                  <span class="detail-label">Icon reference Id</span>
                  <span class="detail-value">{{ getImgId(selectedImage) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Icon snippet</span>
                  <span class="detail-value">
                    <pre>
- name: "{{ getImgTitle(selectedImage) }}"
  type: app-icon
  component: UIAppIconButton
  props:
    label: "{{ getImgTitle(selectedImage) }}"
    url: "https://yourTargetUrl"
    icon: "{{ getImgId(selectedImage) }}"
</pre
                    >
                  </span>
                </div>

                <div class="modal-footer-actions">
                  <button class="btn btn-primary-action">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* Import Fonts */
@import url('https://fonts.googleapis.com/css2?family=Cantarell:wght@400;700&family=Inter:wght@400;700&family=Noto+Sans:wght@400;600&family=Open+Sans:wght@400;600&family=Poppins:wght@400;700&family=Roboto:wght@400;500;700&display=swap');
@import url('https://rsms.me/inter/inter.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* =========================================
   1. ROOT VARIABLES (Global Defaults)
   ========================================= */
.image-browser-host {
  /* Global Defaults */
  --surface-blur: 12px;
  --surface-saturate: 100%;
  --accent-color: #6366f1;

  /* Base Color Components */
  --surface-rgb: 255, 255, 255;
  --surface-bg-opacity: 0.2;
  --surface-bg: rgba(var(--surface-rgb), var(--surface-bg-opacity));
  --surface-border: 1px solid rgba(255, 255, 255, 0.4);

  /* Typography */
  --font-family: 'Inter', sans-serif;
  --text-color: #111;
  --text-secondary: #666;
  --text-tertiary: #999;

  /* Component Geometry */
  --btn-radius: 8px;
  --icon-radius: 12px;
  --folder-radius: 24px;
  --modal-radius: 16px;
  --widget-radius: 20px;

  /* Button Vars */
  --btn-bg: var(--accent-color);
  --btn-text: #fff;
  --btn-border: none;
  --btn-hover-brightness: 1.1;

  /* Overlay */
  --overlay-bg: rgba(0, 0, 0, 0.65);
  --overlay-blur: 5px;

  /* Dropdown */
  --dropdown-bg: #fff;
  --dropdown-border: 1px solid rgba(0, 0, 0, 0.1);
  --dropdown-radius: var(--btn-radius);

  /* Widget Defaults */
  --widget-bg: rgba(255, 255, 255, 0.5);
  --widget-border: 1px solid rgba(255, 255, 255, 0.3);
  --widget-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  /* System Colors */
  --sys-primary: #6366f1;
  --sys-danger: #ef4444;

  /* Desktop Background */
  --desktop-bg: #f3f4f6;

  /* HOST LAYOUT RESET */
  font-family: var(--font-family);
  color: var(--text-color);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition:
    background 0.5s ease,
    color 0.3s ease;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* =========================================
   2. FRAMEWORK DEFINITIONS (Variable Overrides)
   ========================================= */

/* visionOS */
.image-browser-host.framework-vision {
  --surface-rgb: 255, 255, 255;
  --surface-bg-opacity: 0.4;
  --surface-blur: 50px;
  --surface-radius: 40px;
  --surface-border: 1px solid rgba(255, 255, 255, 0.5);
  --text-color: #000;
  --text-secondary: rgba(60, 60, 67, 0.6);
  --font-family: 'Inter', sans-serif;
  --btn-radius: 999px;
  --icon-radius: 999px;
  --modal-radius: 40px;
  --widget-radius: 32px;
  --btn-bg: rgba(0, 0, 0, 0.05);
  --btn-text: #000;
  --overlay-blur: 20px;
  --desktop-bg: url('https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop');
  --sys-primary: #007aff;
  --dropdown-bg: rgba(255, 255, 255, 0.65);
}

/* Fluent */
.image-browser-host.framework-fluent {
  --surface-rgb: 255, 255, 255;
  --surface-bg-opacity: 0.75;
  --surface-blur: 40px;
  --surface-radius: 8px;
  --surface-border: 1px solid rgba(255, 255, 255, 0.4);
  --font-family: 'Open Sans', sans-serif;
  --btn-radius: 4px;
  --modal-radius: 8px;
  --widget-radius: 8px;
  --btn-bg: #0078d4;
  --btn-text: #fff;
  --desktop-bg: #f3f3f3;
  --sys-primary: #0078d4;
  --dropdown-bg: rgba(255, 255, 255, 0.95);
}

/* GNOME */
.image-browser-host.framework-gnome {
  --surface-rgb: 255, 255, 255;
  --surface-bg-opacity: 0.95;
  --surface-blur: 0px;
  --surface-radius: 12px;
  --surface-border: 1px solid rgba(0, 0, 0, 0.1);
  --font-family: 'Cantarell', sans-serif;
  --btn-radius: 6px;
  --modal-radius: 12px;
  --widget-radius: 12px;
  --btn-bg: #f6f5f4;
  --btn-text: #2e3436;
  --desktop-bg: #fafafa;
  --sys-primary: #3584e4;
  --btn-border: 1px solid #cdc7c2;
  --dropdown-bg: #fff;
}

/* KDE */
.image-browser-host.framework-kde {
  --surface-rgb: 252, 252, 252;
  --surface-bg-opacity: 0.65;
  --surface-blur: 16px;
  --surface-radius: 4px;
  --surface-border: 1px solid #3daee9;
  --font-family: 'Noto Sans', sans-serif;
  --btn-radius: 4px;
  --modal-radius: 4px;
  --widget-radius: 4px;
  --btn-bg: #3daee9;
  --btn-text: #fff;
  --desktop-bg: #eff0f1;
  --sys-primary: #3daee9;
  --dropdown-bg: #fcfcfc;
  --widget-bg: rgba(255, 255, 255, 0.9);
}

/* Android */
.image-browser-host.framework-android {
  --surface-rgb: 255, 255, 255;
  --surface-bg-opacity: 0.15;
  --surface-blur: 0px;
  --surface-radius: 28px;
  --font-family: 'Roboto', sans-serif;
  --btn-radius: 20px;
  --modal-radius: 28px;
  --widget-radius: 24px;
  --btn-bg: #eaddff;
  --btn-text: #21005d;
  --desktop-bg: #fffbfe;
  --sys-primary: #6750a4;
  --dropdown-bg: #f3edf7;
  --widget-shadow: 0 1px 3px 1px rgba(0, 0, 0, 0.15);
}

/* NeXTSTEP */
.image-browser-host.framework-nextstep {
  --surface-rgb: 195, 195, 195;
  --surface-bg-opacity: 1;
  --surface-blur: 0px;
  --surface-radius: 0px;
  --surface-border: 2px solid #000;
  --text-color: #000;
  --font-family: 'Inter', sans-serif;
  --btn-radius: 0px;
  --modal-radius: 0px;
  --widget-radius: 0px;
  --btn-bg: #aaa;
  --btn-text: #000;
  --btn-border: 1px solid #000;
  --widget-shadow: 4px 4px 0 rgba(0, 0, 0, 1);
  --desktop-bg: #555555;
  --sys-primary: #000000;
  --dropdown-bg: #fff;
}

/* RISC OS */
.image-browser-host.framework-riscos {
  --surface-rgb: 221, 221, 221;
  --surface-bg-opacity: 1;
  --surface-blur: 0px;
  --surface-radius: 0px;
  --surface-border: 2px outset #ffffff;
  --text-color: #000;
  --text-secondary: #444;
  --font-family: 'Inter', sans-serif;
  --btn-radius: 0px;
  --modal-radius: 0px;
  --widget-radius: 0px;
  --btn-bg: #cccccc;
  --btn-text: #000;
  --btn-border: 2px outset #ffffff;
  --desktop-bg: #b0b0b0;
  --sys-primary: #0000ff;
  --sys-secondary: #777;
  --dropdown-bg: #ddd;
  --dropdown-border: 2px outset #fff;
  --widget-shadow: none;
  --widget-bg: #dcdcdc;
  --widget-border: 2px outset #fff;
}

/* =========================================
   3. DARK MODE (Global & Framework Specific Overrides)
   ========================================= */

.image-browser-host.dark-mode {
  color: #fff;
  --text-color: #fff;
  --text-secondary: #ccc;
  --desktop-bg: #111;
  --surface-rgb: 30, 30, 30;
  --widget-bg: rgba(40, 40, 40, 0.6);
  --surface-border: 1px solid rgba(255, 255, 255, 0.1);
  --dropdown-bg: #222;
}

.image-browser-host.dark-mode.framework-vision {
  --desktop-bg: url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2940&auto=format&fit=crop');
}

.image-browser-host.dark-mode.framework-fluent {
  --desktop-bg: #202020;
  --sys-primary: #4cc2ff;
}

.image-browser-host.dark-mode.framework-gnome {
  --desktop-bg: #242424;
  --surface-rgb: 40, 40, 40;
}

.image-browser-host.dark-mode.framework-kde {
  --desktop-bg: #232629;
  --surface-rgb: 35, 38, 41;
  --surface-border: 1px solid #616e79;
  --widget-bg: rgba(49, 54, 59, 0.9);
}

.image-browser-host.dark-mode.framework-android {
  --desktop-bg: #1c1b1f;
  --sys-primary: #d0bcff;
  --btn-bg: #4f378b;
  --btn-text: #eaddff;
}

.image-browser-host.dark-mode.framework-nextstep {
  --desktop-bg: #000;
  --surface-rgb: 45, 45, 45;
  --widget-shadow: 4px 4px 0 rgba(255, 255, 255, 1);
}

.image-browser-host.dark-mode.framework-riscos {
  --desktop-bg: #333333;
  --surface-rgb: 51, 51, 51;
  --surface-border: 2px inset #111111;
  --btn-bg: #333;
  --btn-border: 2px outset #666;
  --widget-bg: #333;
  --widget-border: 2px outset #666;
}

/* =========================================
   4. COMPONENT STYLES (Variable Usage)
   ========================================= */

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-family: var(--font-family);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--btn-radius);
  background: var(--btn-bg);
  color: var(--btn-text);
  border: var(--btn-border);
  transition:
    filter 0.2s,
    transform 0.1s;
  gap: 8px;
  outline: none;
}

.btn:hover {
  filter: brightness(1.1);
}
.btn:active {
  transform: scale(0.98);
}
.btn-icon {
  padding: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.btn-ghost {
  background: transparent;
  color: var(--text-color);
  border: var(--surface-border);
}

/* Specific component overrides for NeXT/RISC */
.image-browser-host.framework-nextstep .btn:active,
.image-browser-host.framework-riscos .btn:active {
  transform: none;
  border-style: inset;
}
.image-browser-host.framework-nextstep .btn-icon,
.image-browser-host.framework-riscos .btn-icon {
  border-radius: 0;
}

@media (max-width: 600px) {
  .btn-text {
    display: none;
  }
}

/* Layout */
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Widgets */
.ui-widget {
  background: var(--widget-bg);
  border: var(--widget-border);
  border-radius: var(--widget-radius);
  box-shadow: var(--widget-shadow);
}

/* Toolbar & Search */
.gallery-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  align-items: center;
  background: rgba(var(--surface-rgb), 0.2);
  border: var(--surface-border);
  border-radius: var(--btn-radius);
  padding: 8px 12px;
  width: 300px;
  gap: 8px;
}

/* RISC Search overrides */
.image-browser-host.framework-riscos .search-bar {
  border: 2px inset #fff;
  background: #fff;
}
.image-browser-host.dark-mode.framework-riscos .search-bar {
  border: 2px inset #666;
  background: #000;
}

.search-icon {
  color: var(--text-tertiary);
}
.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-family: var(--font-family);
  color: var(--text-color);
  flex: 1; /* Allow input to take remaining space */
}
.filter-controls {
  display: flex;
  gap: 8px;
}

/* New Search Button */
.btn-search-action {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    color 0.2s;
}
.btn-search-action:hover {
  background: rgba(var(--surface-rgb), 0.3);
  color: var(--sys-primary);
}

/* Image Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.img-card {
  background: var(--widget-bg);
  border: var(--widget-border);
  border-radius: var(--widget-radius);
  box-shadow: var(--widget-shadow);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.img-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* Framework Specific Hover States */
.image-browser-host.framework-nextstep .img-card:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.image-browser-host.framework-riscos .img-card:hover {
  transform: none;
  border: 2px solid var(--sys-primary);
}

.img-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: rgba(var(--surface-rgb), 0.1);
  border-radius: calc(var(--widget-radius) * 0.7);
  overflow: hidden;
  position: relative;
}

.image-browser-host.framework-nextstep .img-thumb,
.image-browser-host.framework-riscos .img-thumb {
  border-radius: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.img-card:hover .img-thumb img {
  transform: scale(1.1);
}
.image-browser-host.framework-riscos .img-card:hover .img-thumb img {
  transform: none;
}

.img-meta {
  display: flex;
  flex-direction: column;
}
.img-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color);
}
.img-size {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.card-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 6px;
}
.img-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  border: none;
  cursor: pointer;
}
.action-btn:hover {
  background: var(--sys-primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg);
  backdrop-filter: blur(var(--overlay-blur));
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.modal-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.modal-content {
  background: rgba(var(--surface-rgb), 0.85);
  border: var(--surface-border);
  border-radius: var(--modal-radius);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: scale(0.95);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(calc(var(--surface-blur) * 2));
  -webkit-backdrop-filter: blur(calc(var(--surface-blur) * 2));
}

.modal-overlay.active .modal-content {
  transform: scale(1);
}

/* NeXT & RISC Modal Overrides */
.image-browser-host.framework-nextstep .modal-content {
  background: var(--surface-rgb);
  border: 1px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 1);
}
.image-browser-host.dark-mode.framework-nextstep .modal-content {
  box-shadow: 8px 8px 0 rgba(255, 255, 255, 1);
}

.image-browser-host.framework-riscos .modal-content {
  background: var(--surface-bg);
  border: 2px outset #fff;
  box-shadow: 10px 10px 0 rgba(0, 0, 0, 0.5);
}
.image-browser-host.dark-mode.framework-riscos .modal-content {
  border: 2px outset #666;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  display: flex;
  flex-direction: row;
  height: 500px;
}

.modal-image-container {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.modal-image-container img {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--btn-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* NeXT/RISC Image Overrides */
.image-browser-host.framework-nextstep .modal-image-container img,
.image-browser-host.framework-riscos .modal-image-container img {
  border-radius: 0;
  box-shadow: none;
  border: 2px solid #fff;
}

.modal-details {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(var(--surface-rgb), 0.1);
  border-left: var(--surface-border);
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}
.detail-value {
  font-size: 0.95rem;
  color: var(--text-color);
}
.divider {
  height: 1px;
  background: var(--surface-border);
  width: 100%;
}

.color-palette {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.image-browser-host.framework-nextstep .color-dot,
.image-browser-host.framework-riscos .color-dot {
  border-radius: 0;
  border: 1px solid #000;
}

.close-modal {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-footer-actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
}

.btn-primary-action {
  flex: 1;
  background: var(--sys-primary);
}

@media (max-width: 768px) {
  .modal-body {
    flex-direction: column;
    height: auto;
    overflow-y: auto;
  }
  .modal-image-container {
    height: 300px;
  }
}
</style>
