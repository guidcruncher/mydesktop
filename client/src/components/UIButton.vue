<template>
  <button :class="buttonClasses" :disabled="disabled" v-bind="$attrs">
    <IconView v-if="icon" :name="icon" class="btn__icon" />
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    required: false,
    default: 'secondary',
    validator: (value) =>
      ['prominentGlass', 'icon', 'primary', 'secondary', 'destructive'].includes(value),
  },
  icon: { type: String, required: false, default: undefined },
  /**
   * Disables the button and applies disabled styling.
   * @type {boolean}
   */
  disabled: {
    type: Boolean,
    default: false,
  },
})

const buttonClasses = computed(() => {
  return ['btn', props.variant]
})

// Inherit attributes (like type="submit", @click, etc.) to the root button element
defineOptions({
  inheritAttrs: false,
})
</script>
<style lang="scss">
/*
  NOTE: In a real project, these styles would be imported globally
  or placed in a separate SCSS file. They are included here for
  a self-contained, runnable component example.
*/
.btn__icon {
  width: 20px;
  height: 20px;
  fill: var(--system-blue);
  color: var(--system-blue);
}
</style>
