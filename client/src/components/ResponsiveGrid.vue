<template>
  <div :class="['responsive-grid', `mode-${mode}`]" :style="gridStyles">
    <slot></slot>
  </div>
</template>

<script setup>
import { provide, computed, toRef } from 'vue'

const props = defineProps({
  // 'dynamic' = Flexbox (original behavior)
  // 'fixed' = CSS Grid (Bootstrap-like columns)
  mode: {
    type: String,
    default: 'dynamic',
    validator: (value) => ['dynamic', 'fixed'].includes(value),
  },
  // Total columns for Fixed mode (default 12)
  columns: {
    type: [Number, String],
    default: 12,
  },
})

// Provide configuration to children components
provide('grid-mode', toRef(props, 'mode'))
provide('grid-total-columns', toRef(props, 'columns'))

// Compute dynamic styles for the container
const gridStyles = computed(() => {
  if (props.mode === 'fixed') {
    return {
      // Defines the column tracks (e.g., "repeat(12, 1fr)")
      gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    }
  }
  return {}
})
</script>

<style lang="scss" scoped>
.responsive-grid {
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
}

/* --- Dynamic Mode (Flexbox) --- */
.mode-dynamic {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

/* --- Fixed Mode (Grid) --- */
.mode-fixed {
  display: grid;
  align-items: start;
}
</style>
