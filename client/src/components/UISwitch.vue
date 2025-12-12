<template>
  <!-- 
    The switch uses the 'on' class for styling when modelValue is true,
    and the 'disabled' class to prevent interaction and change opacity.
  -->
  <div :class="['ui-switch', { on: modelValue, disabled: disabled }]" @click="toggleSwitch">
    <div class="ui-switch__knob"></div>
  </div>
</template>

<script lang="ts" setup>
// Note: ref and watch are no longer needed as we rely purely on the prop/emit pattern.

interface Props {
  /** The state of the switch, automatically bound when using v-model */
  modelValue?: boolean
  /** If true, the switch is visually disabled and non-interactive */
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false, // Default to interactive
})

const emit = defineEmits<{
  // This is the required event for two-way binding with v-model
  (event: 'update:modelValue', value: boolean): void
}>()

/**
 * Toggles the switch state and emits the new value, but only if not disabled.
 */
const toggleSwitch = () => {
  if (props.disabled) return

  // Directly calculate the new state from props.modelValue
  // and emit it back to the parent.
  const newState = !props.modelValue
  emit('update:modelValue', newState)
}
</script>

<style lang="scss" scoped>
/* Standard iOS Colors for context */
:root {
  --system-gray5: rgba(118, 118, 128, 0.12);
  --system-green: #34c759;
}

.ui-switch {
  width: 51px;
  height: 31px;
  background-color: var(--system-gray5);
  border-radius: 15.5px;
  position: relative;
  transition: background-color 0.3s ease;
  cursor: pointer;
  user-select: none;
  flex: 0 0 auto; // Prevent flex from resizing it
  box-sizing: border-box;

  &.on {
    background-color: var(--system-green);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__knob {
    width: 27px;
    height: 27px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.on &__knob {
    /* 51px (total width) - 2px (left padding) - 2px (right padding) - 27px (knob width) = 20px translation */
    transform: translateX(20px);
  }
}
</style>
