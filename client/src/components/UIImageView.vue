<template>
  <div class="image-viewer-wrapper">
    <div
      :class="['image-viewer-overlay', { active: modelValue }]"
      id="imageViewer"
      @click="handleOverlayClick"
    >
      <div class="viewer-header">
        <div class="viewer-title">{{ title }}</div>
        <div class="viewer-controls">
          <button :class="['control-btn']" id="downloadBtn" @click="download" title="Download">
            <i class="fa-solid fa-download" />
          </button>

          <button
            :class="['control-btn', { active: currentIsFitMode }]"
            id="fitBtn"
            @click="setFitMode"
            title="Fit to screen (F)"
          >
            <i class="fa-solid fa-expand" />
          </button>
          <button
            :class="['control-btn', { active: !currentIsFitMode }]"
            id="scrollBtn"
            @click="setScrollMode"
            title="Full size (scrollable) (S)"
          >
            <i class="fa-solid fa-maximize" />
          </button>

          <div class="manipulation-dropdown-wrapper" v-if="manipulationEnabled">
            <UIDropdownMenu v-model="isManipulationMenuOpen">
              <template #trigger="{ isOpen }">
                <UIDropdownMenuTrigger
                  class="control-btn"
                  icon="fa-solid fa-tools"
                  title="Image Tools"
                  :active="isOpen"
                />
              </template>

              <UIDropdownMenuItem
                icon="fa-solid fa-redo"
                label="Reset All"
                title="Reset All (R)"
                @click="resetManipulation"
              />

              <hr class="menu-divider" />

              <UIDropdownMenuItem
                :active="isGrayscale"
                icon="fa-solid fa-palette"
                label="Grayscale"
                title="Grayscale (G)"
                @click="toggleGrayscale"
              />
              <UIDropdownMenuItem
                :active="isInverted"
                icon="fa-solid fa-wand-magic-sparkles"
                label="Invert Colors"
                title="Invert Colors (I)"
                @click="toggleInvert"
              />
              <UIDropdownMenuItem
                :active="isSepia"
                icon="fa-solid fa-image"
                label="Sepia Tone"
                title="Sepia Tone (P)"
                @click="toggleSepia"
              />

              <hr class="menu-divider" />

              <UIDropdownMenuItem
                icon="fa-solid fa-magnifying-glass-minus"
                label="Zoom Out"
                title="Zoom Out (-)"
                @click="zoomOut"
              />
              <UIDropdownMenuItem
                icon="fa-solid fa-magnifying-glass-plus"
                label="Zoom In"
                title="Zoom In (=)"
                @click="zoomIn"
              />
              <UIDropdownMenuItem
                icon="fa-solid fa-rotate-right"
                label="Rotate 90°"
                title="Rotate (T)"
                @click="rotateClockwise"
              />
              <UIDropdownMenuItem
                :active="isFlippedH"
                icon="fa-solid fa-arrows-left-right"
                label="Flip Horizontal"
                title="Flip Horizontal (H)"
                @click="toggleFlipHorizontal"
              />
              <UIDropdownMenuItem
                :active="isFlippedV"
                icon="fa-solid fa-arrows-up-down"
                label="Flip Vertical"
                title="Flip Vertical (V)"
                @click="toggleFlipVertical"
              />
            </UIDropdownMenu>
          </div>

          <button class="control-btn close-btn" @click="closeViewer" title="Close (Esc)">
            <i class="fa-solid fa-close" />
          </button>
        </div>
      </div>

      <div
        class="viewer-content"
        @mousedown="handlePanStart"
        @mousemove="handlePanMove"
        @mouseup="handlePanEnd"
        @mouseleave="handlePanEnd"
      >
        <div :class="['image-container', containerModeClass]" ref="imageContainerRef">
          <img
            class="viewer-image"
            :src="displaySrc"
            :alt="title"
            @dragstart.prevent
            :style="[imageTransformStyle, imageFilterStyle]"
          />
        </div>
      </div>

      <div class="viewer-footer">
        <div class="image-info">{{ alt }}</div>
        <div class="mode-indicator">{{ modeIndicatorText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const modelValue = defineModel({ default: false })

const props = defineProps({
  title: { type: String, default: 'Image Viewer' },
  src: { type: String, required: true },
  alt: { type: String, default: 'Image details not provided.' },
  initialFitMode: { type: Boolean, default: true },
  manipulationEnabled: { type: Boolean, default: true },
  useProxy: { type: Boolean, default: false },
  proxyUrl: { type: String, default: '/proxy-image?url=' },
})

const isSameOrigin = (url) => {
  if (typeof window === 'undefined') return false
  if (!url) return false
  if (url.startsWith('/') || !url.includes('://')) return true
  try {
    const pageOrigin = window.location.origin
    const imageUrlObject = new URL(url)
    return imageUrlObject.origin === pageOrigin
  } catch (e) {
    return false
  }
}

const displaySrc = computed(() => {
  if (isSameOrigin(props.src)) return props.src
  if (props.useProxy && props.proxyUrl) {
    const encodedUrl = encodeURIComponent(props.src)
    return `${props.proxyUrl}${encodedUrl}`
  }
  return props.src
})

const ZOOM_STEP = 0.1
const MIN_SCALE = 0.1
const ROTATION_STEP = 90

const scale = ref(1.0)
const rotation = ref(0)
const isFlippedH = ref(false)
const isFlippedV = ref(false)
const isGrayscale = ref(false)
const isInverted = ref(false)
const isSepia = ref(false)
const isManipulationMenuOpen = ref(false) // v-model for the new dropdown

const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)

const imageTransformStyle = computed(() => {
  const scaleX = isFlippedH.value ? -1 * scale.value : scale.value
  const scaleY = isFlippedV.value ? -1 * scale.value : scale.value
  return {
    transform: `scale(${scaleX}, ${scaleY}) rotate(${rotation.value}deg)`,
  }
})

const imageFilterStyle = computed(() => {
  let filters = []
  if (isGrayscale.value) filters.push('grayscale(100%)')
  if (isInverted.value) filters.push('invert(100%)')
  if (isSepia.value) filters.push('sepia(100%)')
  return { filter: filters.join(' ') }
})

const resetManipulation = () => {
  scale.value = 1.0
  rotation.value = 0
  isFlippedH.value = false
  isFlippedV.value = false
  isGrayscale.value = false
  isInverted.value = false
  isSepia.value = false
  isManipulationMenuOpen.value = false
}

const zoomIn = () => {
  if (currentIsFitMode.value) setScrollMode()
  scale.value += ZOOM_STEP
}

const zoomOut = () => {
  if (currentIsFitMode.value) setScrollMode()
  scale.value = Math.max(MIN_SCALE, scale.value - ZOOM_STEP)
}

const rotateClockwise = () => {
  rotation.value = (rotation.value + ROTATION_STEP) % 360
}

const toggleFlipHorizontal = () => {
  isFlippedH.value = !isFlippedH.value
  if (currentIsFitMode.value) setScrollMode()
}

const toggleFlipVertical = () => {
  isFlippedV.value = !isFlippedV.value
  if (currentIsFitMode.value) setScrollMode()
}

const toggleGrayscale = () => (isGrayscale.value = !isGrayscale.value)
const toggleInvert = () => (isInverted.value = !isInverted.value)
const toggleSepia = () => (isSepia.value = !isSepia.value)

const download = () => {
  try {
    let imageURL = displaySrc.value
    let imageDescription = props.alt
    let downloadedImg = new Image()

    const imageReceived = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      let finalWidth = downloadedImg.width
      let finalHeight = downloadedImg.height
      let drawX = -downloadedImg.width / 2
      let drawY = -downloadedImg.height / 2

      if (rotation.value % 180 !== 0) {
        finalWidth = downloadedImg.height
        finalHeight = downloadedImg.width
      }

      canvas.width = finalWidth * scale.value
      canvas.height = finalHeight * scale.value

      const filters = []
      if (isGrayscale.value) filters.push('grayscale(1)')
      if (isInverted.value) filters.push('invert(1)')
      if (isSepia.value) filters.push('sepia(1)')
      if (filters.length > 0) context.filter = filters.join(' ')

      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate((rotation.value * Math.PI) / 180)
      const flipScaleX = (isFlippedH.value ? -1 : 1) * scale.value
      const flipScaleY = (isFlippedV.value ? -1 : 1) * scale.value
      context.scale(flipScaleX, flipScaleY)
      context.drawImage(downloadedImg, drawX, drawY)

      try {
        var link = document.createElement('a')
        const manipulationSuffix = props.manipulationEnabled
          ? `_s${scale.value.toFixed(1)}_r${rotation.value}_h${
              isFlippedH.value ? 1 : 0
            }_v${isFlippedV.value ? 1 : 0}`
          : ''
        link.download = `${imageDescription.replace(/\s/g, '_')}${manipulationSuffix}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch (err) {
        alert(`Error creating download link: ${err}`)
      }
    }

    downloadedImg.addEventListener('load', imageReceived)
    downloadedImg.alt = imageDescription
    downloadedImg.src = imageURL
  } catch (err) {
    alert(`Error initiating download: ${err}`)
  }
}

const handlePanStart = (event) => {
  if (!props.manipulationEnabled || currentIsFitMode.value || event.button !== 0) return
  const container = imageContainerRef.value
  if (!container) return
  if (
    container.scrollWidth <= container.clientWidth &&
    container.scrollHeight <= container.clientHeight
  )
    return

  isPanning.value = true
  panStartX.value = event.pageX + container.scrollLeft
  panStartY.value = event.pageY + container.scrollTop
  container.style.cursor = 'grabbing'
}

const handlePanMove = (event) => {
  if (!isPanning.value || !props.manipulationEnabled) return
  const container = imageContainerRef.value
  if (!container) return
  const dx = panStartX.value - event.pageX
  const dy = panStartY.value - event.pageY
  container.scrollLeft = dx
  container.scrollTop = dy
}

const handlePanEnd = () => {
  if (!isPanning.value) return
  isPanning.value = false
  if (imageContainerRef.value) {
    imageContainerRef.value.style.cursor = 'grab'
  }
}

const emit = defineEmits(['update:modelValue', 'mode-change'])
const currentIsFitMode = ref(props.initialFitMode)
const imageContainerRef = ref(null)
const containerModeClass = computed(() => (currentIsFitMode.value ? 'fit-mode' : 'scroll-mode'))
const modeIndicatorText = computed(() => (currentIsFitMode.value ? 'Fit to Screen' : 'Full Size'))

const closeViewer = () => {
  modelValue.value = false
}

const setFitModeScrollReset = () => {
  if (imageContainerRef.value) {
    imageContainerRef.value.scrollTop = 0
    imageContainerRef.value.scrollLeft = 0
  }
}

const setFitMode = () => {
  currentIsFitMode.value = true
  resetManipulation()
  setFitModeScrollReset()
  emit('mode-change', 'fit')
}

const setScrollMode = () => {
  currentIsFitMode.value = false
  emit('mode-change', 'scroll')
}

watch(
  () => modelValue.value,
  (newVisible) => {
    if (newVisible) {
      document.body.style.overflow = 'hidden'
      resetManipulation()
      currentIsFitMode.value = props.initialFitMode
      if (currentIsFitMode.value) setFitModeScrollReset()
    } else {
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    closeViewer()
  }
}

const handleKeydown = (e) => {
  if (!modelValue.value) return

  if (e.key === 'Escape') {
    if (isManipulationMenuOpen.value) {
      isManipulationMenuOpen.value = false
    } else {
      closeViewer()
    }
  } else if (e.key === 'f' || e.key === 'F') {
    setFitMode()
  } else if (e.key === 's' || e.key === 'S') {
    setScrollMode()
  } else if (props.manipulationEnabled) {
    if (e.key === 'r' || e.key === 'R') resetManipulation()
    else if (e.key === '=') zoomIn()
    else if (e.key === '-') zoomOut()
    else if (e.key === 't' || e.key === 'T') rotateClockwise()
    else if (e.key === 'h' || e.key === 'H') toggleFlipHorizontal()
    else if (e.key === 'v' || e.key === 'V') toggleFlipVertical()
    else if (e.key === 'g' || e.key === 'G') toggleGrayscale()
    else if (e.key === 'i' || e.key === 'I') toggleInvert()
    else if (e.key === 'p' || e.key === 'P') toggleSepia()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.image-viewer-wrapper {
  .image-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    display: flex;
    flex-direction: column;
    z-index: 8000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &.active {
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      opacity: 1;
      visibility: visible;
    }

    .viewer-header {
      z-index: 10;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transform: translateY(-100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.active .viewer-header {
      transform: translateY(0);
    }

    .viewer-title {
      color: white;
      font-size: 16px;
      font-weight: 500;
      flex: 1;
    }

    .viewer-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    /* Menu Divider Helper */
    .menu-divider {
      border: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 4px 0;
    }

    /* Shared Control Button Styles */
    .control-btn {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px; // Matches UIDropDownTrigger
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: white;
      font-size: 18px;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }

      &.active {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &.close-btn {
        background: rgba(255, 59, 48, 0.8);
        border-color: rgba(255, 59, 48, 0.5);
        &:hover {
          background: rgba(255, 59, 48, 1);
        }
      }
    }

    .viewer-content {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }

    .image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &.fit-mode {
        overflow: hidden;
      }

      &.scroll-mode {
        overflow: auto;
        align-items: flex-start;
        justify-content: flex-start;
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        &::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        &::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }
      }
    }

    &.active .image-container {
      transform: scale(1);
      opacity: 1;
    }

    .viewer-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transition:
        all 0.3s ease,
        transform 0.3s ease-out,
        filter 0.3s ease;
      transform-origin: center center;
    }

    .image-container.scroll-mode .viewer-image {
      max-width: none;
      max-height: none;
      width: auto;
      height: auto;
    }

    .viewer-footer {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.active .viewer-footer {
      transform: translateY(0);
    }

    .image-info {
      font-size: 14px;
      opacity: 0.8;
    }

    .mode-indicator {
      background: rgba(255, 255, 255, 0.12);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 768px) {
      .viewer-header,
      .viewer-footer {
        padding: 12px 16px;
      }
      .viewer-title {
        font-size: 14px;
      }
      .image-container {
        padding: 20px;
      }
      .control-btn {
        width: 32px;
        height: 32px;
        font-size: 16px;
      }
    }
  }
}
</style>
