<template>
  <div class="ui-dropdown-wrapper" ref="triggerContainer">
    <div class="dropdown-trigger-wrapper" @click.stop="handleTriggerClick">
      <slot name="trigger" :isOpen="modelValue"></slot>
    </div>

    <Teleport to="body">
      <transition name="dropdown-fade">
        <div v-if="modelValue" class="dropdown-menu" :style="menuStyles" @click.stop>
          <slot></slot>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  align: { type: String, default: 'left' },
})

const emit = defineEmits(['update:modelValue'])

const triggerContainer = ref(null)
const position = ref({ top: 0, left: null, right: null })
const lastOpenedTime = ref(0)

const menuStyles = computed(() => {
  const styles = { top: `${position.value.top}px` }
  if (position.value.left !== null) styles.left = `${position.value.left}px`
  else if (position.value.right !== null) styles.right = `${position.value.right}px`
  return styles
})

const updatePosition = () => {
  if (!triggerContainer.value) return
  const rect = triggerContainer.value.getBoundingClientRect()
  const gap = 4

  // --- SMART ALIGNMENT LOGIC ---
  // 1. Estimate if left-alignment would cause overflow
  //    (We assume a safe min-width for the menu, e.g., 200px)
  const spaceOnRight = window.innerWidth - rect.left
  const wouldOverflow = spaceOnRight < 220

  // 2. Determine effective alignment
  //    Force 'right' if it would overflow, otherwise use prop
  const effectiveAlign = props.align === 'right' || wouldOverflow ? 'right' : 'left'

  if (effectiveAlign === 'right') {
    // RIGHT ALIGN: Menu Right == Trigger Right
    // CSS Right = Window Width - Trigger Right
    position.value = {
      top: rect.bottom + gap,
      left: null,
      right: window.innerWidth - rect.right,
    }
  } else {
    // LEFT ALIGN: Menu Left == Trigger Left
    position.value = {
      top: rect.bottom + gap,
      left: rect.left,
      right: null,
    }
  }
}

const handleTriggerClick = () => {
  const now = Date.now()
  if (!props.modelValue) {
    updatePosition()
    lastOpenedTime.value = now
    emit('update:modelValue', true)
  } else {
    if (now - lastOpenedTime.value > 300) {
      emit('update:modelValue', false)
    }
  }
}

const closeMenu = () => emit('update:modelValue', false)

const handleClickOutside = (event) => {
  if (!props.modelValue) return
  if (triggerContainer.value && triggerContainer.value.contains(event.target)) return
  closeMenu()
}

const handleResize = () => {
  if (props.modelValue) closeMenu()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      updatePosition()
      lastOpenedTime.value = Date.now()
    }
  },
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
})
</script>

<style lang="scss" scoped>
.ui-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: fixed;
  min-width: 200px;
  max-width: 90vw; /* Safety cap for very small screens */
  background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px;
  z-index: 2147483647;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  text-align: left;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease-out;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}
</style>
