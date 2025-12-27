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
<style lang="scss"></style>
