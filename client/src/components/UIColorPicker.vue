<template>
  <div class="picker-compact">
    <div class="color-display">
      <div class="color-preview-compact" :style="{ backgroundColor: modelValue }"></div>
      <div class="hex-display">{{ modelValue }}</div>
    </div>

    <div
      class="spectrum-compact"
      ref="spectrumRef"
      @mousedown="startDragSpectrum"
      @touchstart="startDragSpectrum"
    >
      <div class="spectrum-gradient" :style="{ backgroundColor: `hsl(${hue}, 100%, 50%)` }"></div>
      <div class="cursor" :style="{ left: `${saturation}%`, top: `${100 - lightness}%` }"></div>
    </div>

    <div class="hue-bar" ref="hueBarRef" @mousedown="startDragHue" @touchstart="startDragHue">
      <div class="hue-thumb" :style="{ left: `${(hue / 360) * 100}%` }"></div>
    </div>

    <div class="presets-compact">
      <div
        v-for="color in presetColors"
        :key="color"
        class="preset"
        :class="{ active: modelValue.toUpperCase() === color.toUpperCase() }"
        :style="{ backgroundColor: color }"
        @click="selectPreset(color)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'selected', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const presetColors = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#30B0C7',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF2D55',
]

const hue = ref<number>(0)
const saturation = ref<number>(100)
const lightness = ref<number>(50)
const isDraggingSpectrum = ref<boolean>(false)
const isDraggingHue = ref<boolean>(false)

const spectrumRef = ref<HTMLElement | null>(null)
const hueBarRef = ref<HTMLElement | null>(null)

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

function updateColor(): void {
  const color = hslToHex(hue.value, saturation.value, lightness.value)

  emit('update:modelValue', color)
  emit('selected', {
    hex: color,
    hsla: `hsla(${Math.round(hue.value)}, ${Math.round(saturation.value)}, ${Math.round(lightness.value)}, 1)`,
    rgba: hex2rgba(color, 1),
  })
}

function updateFromHex(hex: string): void {
  if (/^#[0-9A-F]{6}$/i.test(hex)) {
    const hsl = hexToHsl(hex)
    hue.value = hsl.h
    saturation.value = hsl.s
    lightness.value = hsl.l
  }
}

function startDragSpectrum(e: MouseEvent | TouchEvent): void {
  isDraggingSpectrum.value = true
  handleSpectrumMove(e)
}

function startDragHue(e: MouseEvent | TouchEvent): void {
  isDraggingHue.value = true
  handleHueMove(e)
}

function handleSpectrumMove(e: MouseEvent | TouchEvent): void {
  if (!isDraggingSpectrum.value || !spectrumRef.value) return

  const rect = spectrumRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  const x = clientX - rect.left
  const y = clientY - rect.top

  const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100))
  const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100))

  saturation.value = xPercent
  lightness.value = 100 - yPercent
  updateColor()
}

function handleHueMove(e: MouseEvent | TouchEvent): void {
  if (!isDraggingHue.value || !hueBarRef.value) return

  const rect = hueBarRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
  const percent = (x / rect.width) * 100

  hue.value = (percent / 100) * 360
  updateColor()
}

function handleMouseMove(e: MouseEvent | TouchEvent): void {
  handleSpectrumMove(e)
  handleHueMove(e)
}

function stopDragging(): void {
  isDraggingSpectrum.value = false
  isDraggingHue.value = false
}

function selectPreset(color: string): void {
  emit('update:modelValue', color)
}

watch(
  () => props.modelValue,
  (newValue) => {
    updateFromHex(newValue)
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('touchmove', handleMouseMove)
  document.addEventListener('mouseup', stopDragging)
  document.addEventListener('touchend', stopDragging)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('touchmove', handleMouseMove)
  document.removeEventListener('mouseup', stopDragging)
  document.removeEventListener('touchend', stopDragging)
})
</script>

<style lang="scss" scoped>
.picker-compact {
  /* Solid Background, no blur */
  background: var(--ui-card-bg);
  border-radius: var(--radius-medium);
  padding: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  width: 280px;
}

.color-display {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.color-preview-compact {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
}

.hex-display {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--system-gray2);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-primary);
  min-width: 90px;
}

.spectrum-compact {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: crosshair;
  touch-action: none;
}

.spectrum-gradient {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to right, white, transparent), linear-gradient(to top, black, transparent);
}

.cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2.5px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.hue-bar {
  position: relative;
  width: 100%;
  height: 24px;
  border-radius: 12px;
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  touch-action: none;
}

.hue-thumb {
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.presets-compact {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.preset {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  &.active {
    border-color: #007aff;
    transform: scale(1.1);
  }
}
</style>
