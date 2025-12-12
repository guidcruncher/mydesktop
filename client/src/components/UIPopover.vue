<template>
  <div class="popover-wrapper">
    <div v-if="modelValue" class="popover-content" role="dialog" aria-modal="true">
      <p><slot>This is an Apple-style popover!</slot></p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// --- Props Definition ---
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  // New prop for auto-hide duration
  durationSeconds: {
    type: [Number, String],
    default: 5,
  },
})

// --- Emits Definition ---
const emit = defineEmits(['update:modelValue'])

// --- Auto-Hide Logic ---
let timer = null

// Watch the `modelValue` prop for changes
watch(
  () => props.modelValue,
  (newVal) => {
    // 1. Clear any existing timer
    clearTimeout(timer)

    // 2. If the popover just became modelValue, start the auto-hide timer
    if (newVal) {
      const durationMs = parseFloat(props.durationSeconds) * 1000
      // Set a new timer
      timer = setTimeout(() => {
        // Hide the popover by emitting the update event
        props.modelValue = false
        emit('update:modelValue', false)
        // Clear the timer reference after execution
        timer = null
      }, durationMs)
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.popover-wrapper {
  position: relative;
  display: inline-block;

  .popover-content {
    /* Popover positioning and styling for an Apple-like look */
    position: absolute;
    top: -5px; // Position below the trigger
    z-index: 9000;

    min-width: 250px;
    padding: 15px;
    border-radius: var(--radius-medium);

    /* Apple Popover Style: Frosted glass effect */
    background-color: var(--popover-bg);
    color: var(--popover-text);
    backdrop-filter: blur(20px);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.2),
      0 0 0 1px var(--popover-border);

    /* Simple arrow/triangle (can be complex for a perfect replica) */
    &::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid var(--popover-bg);
      z-imdex: 9000;
    }

    p {
    }
  }
}
</style>
