<template>
  <div class="ui-slider-container">
    <div ref="sliderRef" class="ui-slider" @pointerdown="startDrag">
      <div class="ui-slider-fill" :style="{ width: percent + '%' }"></div>
      <div class="ui-slider-thumb" :style="{ left: percent + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
})

const emit = defineEmits(['update:modelValue'])
const sliderRef = ref(null)

const percent = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

const startDrag = (e) => {
  e.preventDefault()
  updateValue(e.clientX)

  const onMove = (ev) => updateValue(ev.clientX)
  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

const updateValue = (clientX) => {
  const rect = sliderRef.value.getBoundingClientRect()
  let pct = (clientX - rect.left) / rect.width
  pct = Math.max(0, Math.min(1, pct))

  let val = props.min + pct * (props.max - props.min)
  if (props.step > 0) {
    val = Math.round(val / props.step) * props.step
  }

  emit('update:modelValue', val)
}
</script>

<style scoped>
.ui-slider-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  width: 100%;
}
.ui-slider {
  position: relative;
  background: rgba(var(--surface-rgb), 0.2);
  border-radius: 99px;
  cursor: pointer;
  height: 8px;
  width: 100%;
  border: var(--surface-border);
  touch-action: none;
}
.ui-slider-fill {
  background: var(--sys-primary);
  height: 100%;
  border-radius: inherit;
  position: absolute;
  pointer-events: none;
}
.ui-slider-thumb {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: transform 0.1s;
}
.ui-slider:active .ui-slider-thumb {
  transform: translate(-50%, -50%) scale(1.15);
}
</style>
