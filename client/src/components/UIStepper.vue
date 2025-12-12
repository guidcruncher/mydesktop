<template>
  <div :class="['ui-stepper', { 'is-disabled': disabled }]">
    <button
      type="button"
      class="stepper-btn stepper-decrement"
      :disabled="isDecrementDisabled || disabled"
      @click="decrement"
      aria-label="Decrement value"
    >
      <svg viewBox="0 0 100 100" fill="currentColor">
        <rect x="25" y="45" width="50" height="10" rx="5" />
      </svg>
    </button>

    <div class="stepper-divider"></div>

    <button
      type="button"
      class="stepper-btn stepper-increment"
      :disabled="isIncrementDisabled || disabled"
      @click="increment"
      aria-label="Increment value"
    >
      <svg viewBox="0 0 100 100" fill="currentColor">
        <rect x="25" y="45" width="50" height="10" rx="5" />
        <rect x="45" y="25" width="10" height="50" rx="5" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** The current value of the stepper (v-model) */
  modelValue: {
    type: Number,
    required: true,
  },
  /** The minimum allowed value */
  min: {
    type: Number,
    default: 0,
  },
  /** The maximum allowed value */
  max: {
    type: Number,
    default: 100,
  },
  /** The amount the value changes per step */
  step: {
    type: Number,
    default: 1,
  },
  /** Whether the stepper is globally disabled */
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

/**
 * Checks if the decrement button should be disabled (at or below min)
 */
const isDecrementDisabled = computed(() => {
  // Use a small epsilon to handle floating point math issues near min/max
  return props.modelValue - props.step < props.min - 1e-6
})

/**
 * Checks if the increment button should be disabled (at or above max)
 */
const isIncrementDisabled = computed(() => {
  return props.modelValue + props.step > props.max + 1e-6
})

/**
 * Decreases the value, clamped to the minimum.
 */
function decrement() {
  if (isDecrementDisabled.value || props.disabled) return
  const newValue = props.modelValue - props.step
  // Ensure the value doesn't go below min, then emit
  emit('update:modelValue', Math.max(newValue, props.min))
}

/**
 * Increases the value, clamped to the maximum.
 */
function increment() {
  if (isIncrementDisabled.value || props.disabled) return
  const newValue = props.modelValue + props.step
  // Ensure the value doesn't go above max, then emit
  emit('update:modelValue', Math.min(newValue, props.max))
}
</script>

<style scoped>
.ui-stepper {
  display: inline-flex;
  align-items: center;
  /* iOS 26 style: More rounded corners */
  border-radius: 14px;
  overflow: hidden;
  /* Liquid Glass Effect: Translucency and subtle border */
  background-color: var(--stepper-bg);
  border: 1px solid var(--stepper-border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px); /* For Liquid Glass effect */
  -webkit-backdrop-filter: blur(10px);
  height: 32px; /* Standard iOS control height */
}

.ui-stepper.is-disabled {
  opacity: 0.6; /* Slight reduction in opacity for disabled state */
}

/* Styles for the Buttons */
.stepper-btn {
  /* Inherit icon color from CSS variables */
  color: var(--stepper-icon-color);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 32px; /* Square buttons */
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s;
}

.stepper-btn:not([disabled]):active {
  background-color: rgba(0, 0, 0, 0.1); /* Subtle press state */
}

/* Disabled State for Buttons */
.stepper-btn[disabled] {
  cursor: not-allowed;
  color: var(--stepper-disabled-icon);
}

.is-disabled .stepper-btn[disabled] {
  /* When global disabled, buttons look disabled too */
  color: var(--stepper-disabled-icon);
}

/* SVG Icon Styling */
.stepper-btn svg {
  width: 18px; /* Standard SF Symbol size imitation */
  height: 18px;
  /* Use fill instead of stroke for the solid SF Symbol look */
  fill: currentColor;
}

/* Divider Style */
.stepper-divider {
  width: 1px;
  height: 70%;
  background-color: var(--stepper-border-color);
}
</style>
