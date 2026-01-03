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
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-family: var(--font-family);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--btn-radius);
  background: var(--btn-bg);
  color: var(--btn-text);
  border: var(--btn-border);
  transition:
    filter 0.2s ease,
    transform 0.1s ease;
  text-decoration: none;
  border: var(--btn-border);
}

.btn:hover {
  filter: brightness(var(--btn-hover-brightness));
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
