<template>
  <div class="ui-split-view" :class="{ 'ui-split-view--collapsed': !modelValue }">
    <div v-show="modelValue" class="ui-split-view__master">
      <slot name="master"></slot>
    </div>

    <div class="ui-split-view__detail">
      <slot name="detail"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 1. Define Props for v-model
const modelValue = defineModel({ default: true })

// 2. Define Emits for v-model updates (required for two-way binding)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// The logic is now CSS/SCSS based on the media query and the collapsed class.
</script>

<style lang="scss" scoped>
.ui-split-view {
  display: flex;
  flex-direction: column; /* Mobile (small screen) stack by default */
  width: 100%;
  min-height: 100vh; // Ensure it takes full viewport height initially

  &__master {
    // Master pane hidden by default on small screens
    display: none;
  }

  &__detail {
    flex-grow: 1; /* Detail pane always visible */
    min-height: 100%;
  }

  // --- Tablet/Desktop Styles: Activate Split View at 768px ---
  @media (min-width: 768px) {
    flex-direction: row; // Change to side-by-side

    &__master {
      display: block; // Master pane visible
      flex: 0 0 320px; // Fixed width for master pane
      max-width: 40%; // Max width constraint
      overflow-y: auto;
      background: var(--ui-background);
      border-right: 1px solid var(--ui-separator);

      // Add a transition for smooth collapsing/expanding
      transition: all 0.3s ease-in-out;
    }

    &__detail {
      flex-grow: 1;
      overflow-y: auto;
    }

    // --- Collapsed State Styling (when modelValue is false) ---
    &.ui-split-view--collapsed {
      &__master {
        // *** CRITICAL: Force the dimensions to 0 to override default width ***
        width: 0 !important;
        min-width: 0 !important;
        flex: 0 0 0 !important;
        display: none;
        // Remove visual separators and content
        padding: 0;
        border-right: none;
        overflow: hidden; // Hides content during transition
      }
    }
  }
}
</style>
