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
  /** The step increment */
  step: {
    type: Number,
    default: 1,
  },
  /** Disable interaction */
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isDecrementDisabled = computed(() => props.modelValue <= props.min)
const isIncrementDisabled = computed(() => props.modelValue >= props.max)

const decrement = () => {
  if (isDecrementDisabled.value || props.disabled) return
  const newValue = Math.max(props.min, props.modelValue - props.step)
  emit('update:modelValue', newValue)
}

const increment = () => {
  if (isIncrementDisabled.value || props.disabled) return
  const newValue = Math.min(props.max, props.modelValue + props.step)
  emit('update:modelValue', newValue)
}
</script>

<style lang="scss" scoped>
.ui-stepper {
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  overflow: hidden;

  /* Solid Background - Removed Glass Effect */
  background-color: var(--stepper-bg);
  border: 1px solid var(--stepper-border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  height: 32px; /* Standard iOS control height */
}

.ui-stepper.is-disabled {
  opacity: 0.6;
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
  background-color: rgba(0, 0, 0, 0.05);
}

/* Disabled State for Buttons */
.stepper-btn[disabled] {
  cursor: not-allowed;
  color: var(--stepper-disabled-icon);
}

.is-disabled .stepper-btn[disabled] {
  /* When global disabled is active, standard disabled color applies */
  color: var(--stepper-disabled-icon);
}

.stepper-btn svg {
  width: 14px;
  height: 14px;
  display: block;
}

/* Vertical Divider */
.stepper-divider {
  width: 1px;
  height: 18px;
  background-color: var(--stepper-border-color);
  opacity: 0.5;
}
</style>
