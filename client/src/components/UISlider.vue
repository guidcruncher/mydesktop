<template>
  <div class="ui-slider">
    <div
      ref="trackRef"
      class="track-container"
      @mousedown="startDrag"
      @touchstart.prevent="startDrag"
    >
      <div class="fill" :style="{ width: `${currentValue}%` }"></div>
      <div class="knob" :style="{ left: `${currentValue}%` }"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: number | string // 0 to 100
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 50,
})

const emit = defineEmits(['update:modelValue'])

const trackRef = ref<HTMLElement | null>(null)
const currentValue = ref(parseFloat(props.modelValue.toString()))

const getPercentage = (clientX: number, track: HTMLElement): number => {
  const rect = track.getBoundingClientRect()
  const rawPct = (clientX - rect.left) / rect.width
  return Math.max(0, Math.min(100, rawPct * 100))
}

const updateValue = (clientX: number) => {
  if (trackRef.value) {
    const newPct = getPercentage(clientX, trackRef.value)
    currentValue.value = Math.round(newPct)
    emit('update:modelValue', currentValue.value)
  }
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  updateValue(clientX)
}

const endDrag = () => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  updateValue(clientX)

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag, { once: true })
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag, { once: true })
}

onMounted(() => {
  // Initialize value from prop
  currentValue.value = parseFloat(props.modelValue.toString())
})

onUnmounted(endDrag) // Cleanup in case the component is destroyed during a drag
</script>

<style lang="scss" scoped>
.ui-slider {
  display: block;
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;

  .track-container {
    position: relative;
    width: 100%;
    height: 4px;
    background: var(--system-gray5);
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
  }

  .fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--system-blue);
    border-radius: 2px;
    transition: width 0.1s;
  }

  .knob {
    position: absolute;
    top: 50%;
    width: 28px;
    height: 28px;
    background: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .track-container:active .knob {
    // Zoom/Glass effect on drag
    transform: translate(-50%, -50%) scale(1.3);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
}
</style>
